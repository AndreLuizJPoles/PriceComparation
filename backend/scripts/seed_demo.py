"""Seed demo stores and products from the active demo adapter fixtures."""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.application.product_use_cases import ProductUseCases
from app.core.logging import configure_logging, get_logger
from app.core.settings import get_settings
from app.infrastructure.db.session import close_db, get_session_factory, init_db
from app.infrastructure.redis_client import close_redis
from app.integrations.stores.demo.adapter import DemoStoreAdapter

logger = get_logger(__name__)


async def run_seed() -> None:
    settings = get_settings()
    configure_logging(settings)
    await init_db(settings)
    adapter = DemoStoreAdapter()
    offers = await adapter.list_all()
    async with get_session_factory(settings)() as session:
        use_cases = ProductUseCases(session, settings=settings)
        for offer in offers:
            await use_cases._ingest_offer(offer)  # noqa: SLF001
        await session.commit()
    logger.info("seed_demo_complete", offers=len(offers))
    await close_redis()
    await close_db()


if __name__ == "__main__":
    asyncio.run(run_seed())