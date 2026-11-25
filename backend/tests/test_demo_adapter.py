"""Demo store adapter tests."""

import pytest

from app.integrations.stores.demo.adapter import DemoStoreAdapter


@pytest.mark.asyncio
async def test_demo_search_iphone() -> None:
    adapter = DemoStoreAdapter()
    results = await adapter.search("iphone", limit=10)
    assert len(results) >= 1
    assert all(r.is_demo for r in results)


@pytest.mark.asyncio
async def test_demo_health() -> None:
    adapter = DemoStoreAdapter()
    health = await adapter.health()
    assert health.status == "ok"