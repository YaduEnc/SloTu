from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, settings
from app.db import get_db


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


def get_app_settings() -> Settings:
    return settings
