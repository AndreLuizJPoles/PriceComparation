"""Health and readiness endpoints."""

from sqlalchemy import text

from fastapi import APIRouter

from app.core.settings import get_settings
from app.infrastructure.db.session import get_session_factory
from app.infrastructure.redis_client import CacheService

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, object]:
    settings = get_settings()
    return {
        "data": {
            "status": "ok",
            "service": settings.app_name,
            "demo_mode": settings.demo_mode,
        },
        "meta": {"is_demo": settings.demo_mode},
        "error": None,
    }


@router.get("/ready")
async def ready() -> dict[str, object]:
    settings = get_settings()
    db_ok = False
    redis_ok = False
    try:
        async with get_session_factory()() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    cache = CacheService()
    redis_ok = await cache.ping()
    status_label = "ready" if db_ok and redis_ok else "degraded"
    return {
        "data": {
            "status": status_label,
            "checks": {
                "api": True,
                "database": db_ok,
                "redis": redis_ok,
            },
            "demo_mode": settings.demo_mode,
            "demo_banner": "Dados de demonstração" if settings.demo_mode else None,
        },
        "meta": {"is_demo": settings.demo_mode},
        "error": None,
    }