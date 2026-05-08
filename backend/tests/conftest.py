import os
from collections.abc import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://slotu:slotu@localhost:5432/slotu")
os.environ.setdefault("REDIS_URL", "redis://:password@localhost:6379/0")

from app.db import get_db
from app.main import create_app
from app.services import auth_service, user_service

TEST_TABLES = (
    "waitlist",
    "audit_log",
    "payouts",
    "notifications",
    "disputes",
    "reviews",
    "credentials_vault",
    "escrow_transactions",
    "orders",
    "listings",
    "seller_profiles",
    "otp_requests",
    "users",
)

SYNC_DATABASE_URL = os.environ["DATABASE_URL"].replace("+asyncpg", "")
sync_engine = create_engine(SYNC_DATABASE_URL, pool_pre_ping=True)
SyncSessionLocal = sessionmaker(bind=sync_engine)

async_engine = create_async_engine(
    os.environ["DATABASE_URL"],
    pool_pre_ping=True,
    poolclass=NullPool,
)
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False, class_=AsyncSession)


class FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        self._store[key] = value
        return True

    async def flushdb(self) -> bool:
        self._store.clear()
        return True

    async def delete(self, key: str) -> int:
        return 1 if self._store.pop(key, None) is not None else 0


def reset_db() -> None:
    with sync_engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {', '.join(TEST_TABLES)} RESTART IDENTITY CASCADE"))


@pytest.fixture(autouse=True)
def clean_state() -> Generator[None, None, None]:
    reset_db()
    yield
    reset_db()


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch: pytest.MonkeyPatch) -> Generator[FakeRedis, None, None]:
    redis = FakeRedis()
    monkeypatch.setattr(auth_service, "redis_client", redis)
    monkeypatch.setattr(user_service, "redis_client", redis)
    yield redis


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    app = create_app()

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with AsyncSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def session_factory() -> sessionmaker[Session]:
    return SyncSessionLocal
