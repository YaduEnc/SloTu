from app.celery_app import celery_app


@celery_app.task(name="notify.send_sms")
def send_sms_notification() -> None:
    """Placeholder task for phase 1 backend scaffolding."""


@celery_app.task(name="notify.send_email")
def send_email_notification() -> None:
    """Placeholder task for phase 1 backend scaffolding."""
