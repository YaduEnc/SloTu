# 06 — Escrow State Machine (Order Lifecycle)

## States

| State | Meaning | Funds location |
|-------|---------|----------------|
| `pending` | Order created, awaiting payment | not yet captured |
| `paid` | Payment captured into Slotu Cashfree account | Slotu escrow |
| `delivered` | Buyer revealed credentials successfully | Slotu escrow |
| `confirmed` | Buyer tapped confirm OR auto-confirm timer fired | Slotu escrow (about to release) |
| `released` | Payout success to seller | Seller account |
| `disputed` | Either party raised a dispute | Slotu escrow (frozen) |
| `refunded` | Refund completed to buyer | Buyer (via Cashfree refund) |
| `cancelled` | Order cancelled before payment | nothing captured |
| `expired` | Pending order timed out | nothing captured |

## Allowed transitions

```
pending ──► paid ──► delivered ──► confirmed ──► released ✅
   │         │           │             │
   │         │           │             └──► disputed ──► refunded | released
   │         │           └──► disputed
   │         └──► disputed
   │
   ├──► cancelled  (buyer cancel within 5 min, or payment failed/dropped)
   └──► expired    (no payment within 30 min of creation)
```

## Transition rules

### `pending → paid`
- **Trigger**: Cashfree `PAYMENT_SUCCESS_WEBHOOK` (signature verified).
- **Side effects** (atomic):
  - `escrow_transactions.payment_status = 'success'`
  - `escrow_transactions.cashfree_payment_id = <id>`
  - `orders.expires_at = NOW() + 24 hours` (start auto-confirm clock)
  - Notify seller: "Order received — deliver access"
  - Schedule Celery task `try_auto_deliver(order_id)` (immediate)
  - Audit log

### `paid → delivered`
- **Trigger**: Buyer successfully reveals credentials via `/api/vault/orders/:id/reveal/verify`.
- **Side effects**:
  - `orders.delivered_at = NOW()`
  - `credentials_vault.consumed_by_order_id = order_id`
  - Notify seller: "Buyer accessed credentials"

### `delivered → confirmed`
- **Trigger A**: Buyer calls `POST /api/orders/:id/confirm`.
- **Trigger B**: Celery Beat task `auto_confirm_orders` finds orders where `status='delivered'` AND `expires_at < NOW()` and no open dispute.
- **Side effects**:
  - `orders.confirmed_at = NOW()`
  - Schedule Celery `payout_to_seller(order_id)` immediately

### `confirmed → released`
- **Trigger**: Cashfree Payouts `TRANSFER_SUCCESS` webhook.
- **Side effects**:
  - `orders.released_at = NOW()`
  - `payouts.settled_at = NOW()`
  - `seller_profiles.total_sales += 1`
  - Notify both: "Payout complete"
  - Eligible for review

### Any active state → `disputed`
- **Trigger**: `POST /api/disputes` from buyer or seller.
- **Side effects**:
  - Order status `→ 'disputed'`
  - **Cancel any pending payouts** (Cashfree Payouts cancel transfer if not yet processed)
  - Notify counterparty + admin
  - Stop auto-confirm timer for this order

### `disputed → refunded` (admin resolve buyer-favour)
- **Trigger**: Admin `POST /api/admin/disputes/:id/resolve` with `resolution=buyer_refund`.
- **Side effects**:
  - Cashfree refund called (full or partial)
  - `escrow_transactions.refund_status = 'queued'` → webhook updates to `success`
  - On `REFUND_STATUS_WEBHOOK success`: `orders.status='refunded'`
  - Restore listing slot if order had reduced slots_available

### `disputed → released` (admin resolve seller-favour)
- **Trigger**: Admin resolves `seller_release`.
- **Side effects**: Same as `confirmed → released`.

### `disputed → split` (admin resolves split)
- Cashfree refund partial to buyer + payout partial to seller.

### `pending → cancelled`
- **Trigger A**: Buyer cancel within 5 min.
- **Trigger B**: Cashfree `PAYMENT_FAILED` / `USER_DROPPED` webhook.
- **Side effects**:
  - Restore `listings.slots_available += 1`
  - `escrow_transactions.payment_status = 'failed'`

### `pending → expired`
- **Trigger**: Celery Beat task every 5 min: orders where `status='pending'` AND `created_at < NOW() - 30 min`.
- Same side effects as `cancelled`.

## State machine implementation

Use a single `escrow_service.transition(order, new_state, **context)` function. Validate transition is in allow-set:

```python
ALLOWED = {
    'pending':   {'paid','cancelled','expired'},
    'paid':      {'delivered','disputed','refunded'},
    'delivered': {'confirmed','disputed'},
    'confirmed': {'released','disputed'},
    'disputed':  {'refunded','released'},
    'released':  set(),     # terminal
    'refunded':  set(),     # terminal
    'cancelled': set(),     # terminal
    'expired':   set(),     # terminal
}
```

If transition invalid → raise `InvalidStateTransition` (HTTP 409).

Every transition creates an audit_log entry with `before/after` JSON.

## Auto-confirm Celery Beat task

```python
@celery_app.task(name="orders.auto_confirm")
def auto_confirm_orders():
    cutoff = datetime.now(UTC)
    rows = db.execute(
        select(Order)
        .where(Order.status == 'delivered')
        .where(Order.expires_at < cutoff)
        .where(~exists().where(Dispute.order_id == Order.id, Dispute.status == 'open'))
        .with_for_update(skip_locked=True)
    ).scalars().all()
    for order in rows:
        try:
            escrow_service.transition(order, 'confirmed', actor='system')
            payout_to_seller.delay(str(order.id))
        except Exception as e:
            sentry_sdk.capture_exception(e)
```

Beat schedule: `crontab(minute='*/5')` (every 5 min).

## Anti-abuse rules

- Cannot dispute an order more than once.
- Cannot dispute after `released_at + 7 days`.
- Cannot review until status is `released`.
- Buyer cannot confirm if order has open dispute.
