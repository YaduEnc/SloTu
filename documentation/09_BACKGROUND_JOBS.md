# 09 — Background Jobs (Celery + Beat)

## Stack

- Broker: Redis (`REDIS_URL`)
- Result backend: Redis (same)
- Worker concurrency: 4 (tune via env `CELERY_WORKERS`)
- Beat: separate container/process

## Celery app config (`app/celery_app.py`)

```python
from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "slotu",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.auto_confirm",
        "app.tasks.payout_retry",
        "app.tasks.notify_async",
        "app.tasks.cleanup",
        "app.tasks.trust_score",
    ],
)

celery_app.conf.task_acks_late = True
celery_app.conf.task_reject_on_worker_lost = True
celery_app.conf.task_default_queue = "default"
celery_app.conf.timezone = "UTC"

celery_app.conf.beat_schedule = {
    "auto-confirm-orders": {
        "task": "orders.auto_confirm",
        "schedule": crontab(minute="*/5"),
    },
    "expire-pending-orders": {
        "task": "orders.expire_pending",
        "schedule": crontab(minute="*/5"),
    },
    "retry-failed-payouts": {
        "task": "payouts.retry_failed",
        "schedule": crontab(minute="*/15"),
    },
    "recompute-trust-scores": {
        "task": "trust.recompute_dirty",
        "schedule": crontab(minute="*/30"),
    },
    "cleanup-otp-requests": {
        "task": "cleanup.otp_requests",
        "schedule": crontab(hour="*/6"),
    },
    "cleanup-audit-log": {
        "task": "cleanup.audit_log",
        "schedule": crontab(hour=3, minute=0),  # daily 3 AM UTC
    },
}
```

## Tasks

### `orders.auto_confirm` (every 5 min)
Find orders where `status='delivered'` AND `expires_at < NOW()` AND no open dispute. For each, transition to `confirmed` and enqueue `payouts.create_for_order`.

```python
@celery_app.task(name="orders.auto_confirm", bind=True, max_retries=3)
def auto_confirm_orders(self):
    with SessionLocal() as db:
        cutoff = datetime.now(timezone.utc)
        rows = db.execute(
            select(Order)
            .where(Order.status == 'delivered')
            .where(Order.expires_at < cutoff)
            .with_for_update(skip_locked=True)
        ).scalars().all()
        for order in rows:
            if has_open_dispute(db, order.id):
                continue
            try:
                escrow_service.transition(db, order, 'confirmed', actor='system')
                db.commit()
                payouts_create_for_order.delay(str(order.id))
            except Exception as exc:
                db.rollback()
                sentry_sdk.capture_exception(exc)
```

### `orders.expire_pending` (every 5 min)
Orders in `pending` older than 30 min → `expired`. Restore slots.

### `payouts.create_for_order`
Triggered after `confirmed` transition. Calls Cashfree Transfers API. Stores `cashfree_transfer_id`.

### `payouts.retry_failed` (every 15 min)
Find `payouts` with `status='failed'` AND `attempt_count < 3`. Retry with exponential backoff hint.

### `notify.send_sms` / `notify.send_email`
Async SMS/Email send. Wrapped with retry (3 attempts).

### `vault.auto_deliver` (immediate after `paid`)
Currently no-op — buyer must explicitly request reveal via OTP. But this task can pre-warm or notify.

### `trust.recompute_dirty` (every 30 min)
Sellers flagged dirty in Redis set `trust:dirty_sellers` get `trust_score` recomputed.

Trust score formula:
```
trust = 0.7 * avg(reviews_rating) + 0.3 * (1 - dispute_rate)
where dispute_rate = total_disputes / max(total_sales, 1)
```

Rounded to 2 decimals, capped 0.0–5.0.

### `cleanup.otp_requests` (every 6 hours)
Delete `otp_requests` rows older than 24 hours.

### `cleanup.audit_log` (daily)
Archive `audit_log` rows older than 365 days to S3, then delete.

## Idempotency

- Every task that mutates external state uses idempotency keys.
- Use Redis `SETNX task:<task_id>:done EX 86400` after success to prevent duplicate runs.

## Monitoring

- Flower UI on port 5555 (auth-protected via env user/pass).
- Sentry captures unhandled exceptions.
- Custom metric: `slotu.celery.task.<name>.duration` to Prometheus/StatsD.
