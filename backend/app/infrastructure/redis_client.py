"""Async Redis client wrapper."""

from collections.abc import AsyncGenerator
from typing import Any

import redis.asyncio as redis

from app.core.settings import Settings, get_settings

_redis: redis.Redis | None = None


def get_redis(settings: Settings | None = None) -> redis.Redis:
    global _redis
    if _redis is None:
        cfg = settings or get_settings()
        _redis = redis.from_url(cfg.redis_url, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def get_redis_dep() -> AsyncGenerator[redis.Redis, None]:
    yield get_redis()


class CacheService:
    """Thin Redis cache helper."""

    def __init__(self, client: redis.Redis | None = None) -> None:
        self._client = client or get_redis()

    async def get(self, key: str) -> str | None:
        value = await self._client.get(key)
        return value if isinstance(value, str | type(None)) else str(value) if value else None

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        await self._client.setex(key, ttl_seconds, value)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        cursor = 0
        while True:
            cursor, keys = await self._client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await self._client.delete(*keys)
            if cursor == 0:
                break

    async def set_password_reset_token(self, token: str, user_id: str, ttl_minutes: int) -> None:
        await self._client.setex(f"pwd_reset:{token}", ttl_minutes * 60, user_id)

    async def get_password_reset_user_id(self, token: str) -> str | None:
        return await self.get(f"pwd_reset:{token}")

    async def delete_password_reset_token(self, token: str) -> None:
        await self.delete(f"pwd_reset:{token}")

    async def ping(self) -> bool:
        try:
            return bool(await self._client.ping())
        except Exception:
            return False