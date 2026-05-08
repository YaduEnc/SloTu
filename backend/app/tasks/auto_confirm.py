from app.celery_app import celery_app


@celery_app.task(name="orders.auto_confirm")
def auto_confirm_orders() -> None:
    """Placeholder task for phase 1 backend scaffolding."""


@celery_app.task(name="orders.expire_pending")
def expire_pending_orders() -> None:
    """Placeholder task for phase 1 backend scaffolding."""
