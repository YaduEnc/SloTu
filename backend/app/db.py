from collections.abc import AsyncGenerator

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
redis_client = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def check_database_connection() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False


async def check_redis_connection() -> bool:
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False


async def shutdown_resources() -> None:
    await redis_client.aclose()
    await engine.dispose()
