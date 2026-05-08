from fastapi import APIRouter, status

from app.schemas.health import HealthResponse
from app.services.health_service import get_health_status

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Backend health check",
)
async def health_check() -> HealthResponse:
    """Return the current API, database, and Redis health."""
    return await get_health_status()
