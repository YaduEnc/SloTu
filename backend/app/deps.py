from collections.abc import AsyncGenerator

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, settings
from app.core.exceptions import AppError
from app.db import get_db
from app.models.user import User
from app.services.auth_service import get_current_user_from_token


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


def get_app_settings() -> Settings:
    return settings


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")
    return await get_current_user_from_token(db, authorization.removeprefix("Bearer ").strip())
