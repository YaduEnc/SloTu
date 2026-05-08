from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "slotu",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
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
        "schedule": crontab(hour=3, minute=0),
    },
}
