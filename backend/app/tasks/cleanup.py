from app.celery_app import celery_app


@celery_app.task(name="cleanup.otp_requests")
def cleanup_otp_requests() -> None:
    """Placeholder task for phase 1 backend scaffolding."""


@celery_app.task(name="cleanup.audit_log")
def cleanup_audit_log() -> None:
    """Placeholder task for phase 1 backend scaffolding."""
