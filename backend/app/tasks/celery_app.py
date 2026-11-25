"""Celery application configuration."""

from celery import Celery
from datetime import timedelta

from app.core.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "price_comparator",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.refresh_store_prices", "app.tasks.evaluate_alerts"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    beat_schedule={
        "refresh-store-prices": {
            "task": "app.tasks.refresh_store_prices.refresh_store_prices",
            "schedule": timedelta(minutes=settings.price_refresh_interval_minutes),
        },
        "evaluate-price-alerts": {
            "task": "app.tasks.evaluate_alerts.evaluate_alerts",
            "schedule": timedelta(minutes=15),
        },
    },
)