from app.config import settings
from app.db import check_database_connection, check_redis_connection
from app.schemas.health import HealthResponse


async def get_health_status() -> HealthResponse:
    db_ok = await check_database_connection()
    redis_ok = await check_redis_connection()
    return HealthResponse(
        status="ok" if db_ok and redis_ok else "degraded",
        version=settings.app_version,
        db="ok" if db_ok else "down",
        redis="ok" if redis_ok else "down",
    )
