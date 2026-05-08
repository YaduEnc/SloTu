from app.celery_app import celery_app


@celery_app.task(name="payouts.create_for_order")
def create_payout_for_order() -> None:
    """Placeholder task for phase 1 backend scaffolding."""


@celery_app.task(name="payouts.retry_failed")
def retry_failed_payouts() -> None:
    """Placeholder task for phase 1 backend scaffolding."""
