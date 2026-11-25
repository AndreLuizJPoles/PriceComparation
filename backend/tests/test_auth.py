"""Auth API happy path."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient, patch_cache) -> None:
    _ = patch_cache
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "safePass1!", "name": "Demo User"},
    )
    assert register.status_code == 200
    body = register.json()
    assert body["data"]["access_token"]
    assert body["error"] is None

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "safePass1!"},
    )
    assert login.status_code == 200
    assert login.json()["data"]["access_token"]