"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app import __version__
from app.api.v1 import api_router
from app.core.logging import configure_logging, get_logger
from app.core.rate_limit import limiter
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.settings import get_settings
from app.infrastructure.db.session import close_db, init_db
from app.infrastructure.redis_client import close_redis

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings)
    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1)
    await init_db(settings)
    logger.info(
        "app_starting",
        app_name=settings.app_name,
        env=settings.app_env,
        demo_mode=settings.demo_mode,
        version=__version__,
    )
    yield
    await close_redis()
    await close_db()
    logger.info("app_stopping")


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "Comparador Inteligente de Preços API. "
            "Store listings are demo fixtures (is_demo=true) until official store APIs are enabled."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    application.add_middleware(SlowAPIMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix="/api/v1")

    @application.get("/health")
    async def root_health() -> JSONResponse:
        return JSONResponse(
            {
                "data": {"status": "ok", "demo_mode": settings.demo_mode},
                "meta": {"is_demo": settings.demo_mode},
                "error": None,
            }
        )

    @application.middleware("http")
    async def attach_request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)
        return response

    return application


app = create_app()