"""Celery task to evaluate active price alerts (e-mail stub)."""

import asyncio
from datetime import UTC, datetime

from app.core.logging import get_logger
from app.infrastructure.db.session import close_db, get_session_factory, init_db
from app.infrastructure.email import get_email_port
from app.repositories.alert_repository import AlertRepository
from app.repositories.product_repository import ProductRepository
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


async def _evaluate() -> int:
    await init_db()
    triggered = 0
    email = get_email_port()
    async with get_session_factory()() as session:
        alerts = AlertRepository(session)
        products = ProductRepository(session)
        for alert in await alerts.list_active():
            offers = await products.get_offers_for_product(alert.product_id)
            if not offers:
                continue
            best_total = float(offers[0][0].total_price)
            if best_total <= float(alert.target_price):
                alert.last_triggered_at = datetime.now(UTC)
                await alerts.update(alert, is_active=True)
                triggered += 1
                logger.info(
                    "price_alert_email_stub",
                    alert_id=str(alert.id),
                    note="EmailPort stub — wire SMTP later",
                )
                _ = email
                logger.info(
                    "price_alert_triggered_stub",
                    alert_id=str(alert.id),
                    best_total=best_total,
                    target=float(alert.target_price),
                )
        await session.commit()
    return triggered


@celery_app.task(name="app.tasks.evaluate_alerts.evaluate_alerts")
def evaluate_alerts() -> dict[str, int]:
    loop = asyncio.new_event_loop()
    try:
        count = loop.run_until_complete(_evaluate())
    finally:
        loop.run_until_complete(close_db())
        loop.close()
    return {"triggered": count}