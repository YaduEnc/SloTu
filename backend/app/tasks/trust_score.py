from app.celery_app import celery_app


@celery_app.task(name="trust.recompute_dirty")
def recompute_dirty_trust_scores() -> None:
    """Placeholder task for phase 1 backend scaffolding."""
