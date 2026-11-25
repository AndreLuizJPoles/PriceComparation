"""Pytest fixtures — SQLite in-memory DB and in-process cache stub."""

import os
from collections.abc import AsyncGenerator, Generator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-with-enough-length")
os.environ.setdefault("DEMO_MODE", "true")

from app.core.deps import get_cache
from app.core.settings import get_settings
from app.infrastructure.db import session as db_session
from app.infrastructure.redis_client import CacheService
from app.main import create_app
from app.models import Base


class MemoryCache(CacheService):
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        _ = ttl_seconds
        self._store[key] = value

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    async def delete_pattern(self, pattern: str) -> None:
        prefix = pattern.replace("*", "")
        keys = [k for k in self._store if k.startswith(prefix)]
        for key in keys:
            del self._store[key]

    async def set_password_reset_token(self, token: str, user_id: str, ttl_minutes: int) -> None:
        await self.set(f"pwd_reset:{token}", user_id, ttl_minutes * 60)

    async def get_password_reset_user_id(self, token: str) -> str | None:
        return await self.get(f"pwd_reset:{token}")

    async def delete_password_reset_token(self, token: str) -> None:
        await self.delete(f"pwd_reset:{token}")

    async def ping(self) -> bool:
        return True


@pytest.fixture(autouse=True)
def _reset_settings_cache() -> Generator[None, None, None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest_asyncio.fixture
async def db_engine():
    get_settings.cache_clear()
    engine = create_async_engine(os.environ["DATABASE_URL"], future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    db_session._engine = engine
    db_session._session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    db_session._engine = None
    db_session._session_factory = None


@pytest_asyncio.fixture
async def client(db_engine, memory_cache) -> AsyncGenerator[AsyncClient, None]:
    _ = db_engine
    application = create_app()
    application.dependency_overrides[get_cache] = lambda: memory_cache
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    application.dependency_overrides.clear()


@pytest.fixture
def memory_cache() -> MemoryCache:
    return MemoryCache()


@pytest.fixture(autouse=True)
def patch_cache(monkeypatch: pytest.MonkeyPatch, memory_cache: MemoryCache) -> MemoryCache:
    monkeypatch.setattr("app.infrastructure.redis_client.get_redis", lambda: None)
    monkeypatch.setattr("app.core.dependencies.get_cache_service", lambda: memory_cache)
    monkeypatch.setattr("app.core.deps.get_cache", lambda: memory_cache)
    monkeypatch.setattr(
        "app.infrastructure.redis_client.CacheService",
        lambda *args, **kwargs: memory_cache,
    )
    return memory_cache