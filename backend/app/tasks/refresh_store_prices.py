"""Celery task to refresh offers from enabled store adapters."""

import asyncio

from app.core.logging import get_logger
from app.core.settings import get_settings
from app.infrastructure.db.session import close_db, get_session_factory, init_db
from app.infrastructure.redis_client import CacheService, close_redis
from app.integrations.stores.registry import get_adapter_registry
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


async def _refresh() -> int:
    settings = get_settings()
    await init_db(settings)
    updated = 0
    registry = get_adapter_registry(settings)
    cache = CacheService()
    async with get_session_factory(settings)() as session:
        from app.application.product_use_cases import ProductUseCases

        use_cases = ProductUseCases(session, cache=cache, settings=settings)
        for adapter in registry.enabled_adapters():
            if hasattr(adapter, "list_all"):
                offers = await adapter.list_all()  # type: ignore[attr-defined]
            else:
                offers = await adapter.search("a", limit=50)
            for offer in offers:
                if not offer.name:
                    continue
                await use_cases._ingest_offer(offer)  # noqa: SLF001
                updated += 1
        await session.commit()
    await cache.delete_pattern("search:*")
    return updated


@celery_app.task(name="app.tasks.refresh_store_prices.refresh_store_prices")
def refresh_store_prices() -> dict[str, int]:
    loop = asyncio.new_event_loop()
    try:
        count = loop.run_until_complete(_refresh())
    finally:
        loop.run_until_complete(close_redis())
        loop.run_until_complete(close_db())
        loop.close()
    logger.info("refresh_store_prices_done", updated=count)
    return {"updated": count}