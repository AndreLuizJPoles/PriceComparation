"""FastAPI dependencies."""

import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.alerts_use_cases import AlertsUseCases
from app.application.auth_use_cases import AuthUseCases
from app.application.favorites_use_cases import FavoritesUseCases
from app.application.product_use_cases import ProductUseCases
from app.core.settings import Settings, get_settings
from app.infrastructure.jwt import TokenError, decode_token
from app.infrastructure.redis_client import CacheService, get_redis
from app.infrastructure.db.session import get_db_session
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


def get_cache_service() -> CacheService:
    return CacheService(get_redis())


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User | None:
    if not credentials:
        return None
    settings = get_settings()
    try:
        payload = decode_token(credentials.credentials, settings=settings, expected_type="access")
    except TokenError:
        return None
    user_id = uuid.UUID(str(payload["sub"]))
    return await UserRepository(session).get_by_id(user_id)


async def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def get_auth_use_cases(
    session: Annotated[AsyncSession, Depends(get_session)],
    cache: Annotated[CacheService, Depends(get_cache_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthUseCases:
    return AuthUseCases(session, cache=cache, settings=settings)


def get_product_use_cases(
    session: Annotated[AsyncSession, Depends(get_session)],
    cache: Annotated[CacheService, Depends(get_cache_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ProductUseCases:
    return ProductUseCases(session, cache=cache, settings=settings)


def get_favorites_use_cases(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FavoritesUseCases:
    return FavoritesUseCases(session)


def get_alerts_use_cases(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AlertsUseCases:
    return AlertsUseCases(session)


def get_refresh_cookie(
    settings: Annotated[Settings, Depends(get_settings)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> str | None:
    _ = settings.refresh_cookie_name
    return refresh_token