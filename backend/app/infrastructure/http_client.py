"""Hardened httpx async client for future store integrations."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx

DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
DEFAULT_LIMITS = httpx.Limits(max_connections=20, max_keepalive_connections=10)


@asynccontextmanager
async def secure_http_client(
    allowed_hosts: frozenset[str] | None = None,
) -> AsyncIterator[httpx.AsyncClient]:
    """Yield an httpx client with timeouts; host allowlist enforced at call sites."""
    _ = allowed_hosts
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT, limits=DEFAULT_LIMITS) as client:
        yield client


def assert_host_allowed(url: str, allowed_hosts: frozenset[str]) -> None:
    host = httpx.URL(url).host
    if host is None or host not in allowed_hosts:
        raise ValueError(f"Host not in allowlist: {host}")