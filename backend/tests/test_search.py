"""Product search endpoint test."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.product_use_cases import ProductUseCases
from app.infrastructure.db.session import get_session_factory
from app.integrations.stores.demo.adapter import DemoStoreAdapter


@pytest.mark.asyncio
async def test_search_returns_demo_products(
    client: AsyncClient,
    db_engine,
    patch_cache,
) -> None:
    _ = db_engine
    _ = patch_cache
    async with get_session_factory()() as session:
        await _seed(session)
    response = await client.get("/api/v1/products/search", params={"q": "iphone"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["error"] is None
    assert len(payload["data"]) >= 1
    assert payload["meta"]["is_demo"] is True
    assert all(item["is_demo"] for item in payload["data"])


async def _seed(session: AsyncSession) -> None:
    adapter = DemoStoreAdapter()
    use_cases = ProductUseCases(session)
    for offer in await adapter.list_all():
        await use_cases._ingest_offer(offer)  # noqa: SLF001
    await session.commit()