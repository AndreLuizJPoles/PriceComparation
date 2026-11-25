"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth_use_cases import AuthError, AuthUseCases
from app.core.deps import get_cache, get_session
from app.core.settings import get_settings
from app.infrastructure.redis_client import CacheService
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.envelope import ResponseEnvelope, ok

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "refresh_token"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_refresh_token_expire_days * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path="/api/v1/auth",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


@router.post("/register", response_model=ResponseEnvelope[TokenResponse])
async def register(
    body: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[TokenResponse]:
    settings = get_settings()
    try:
        access, refresh = await AuthUseCases(session, cache).register(
            body.email, body.password, body.name
        )
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    _set_refresh_cookie(response, refresh)
    return ok(
        TokenResponse(
            access_token=access,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )
    )


@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
async def login(
    body: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[TokenResponse]:
    settings = get_settings()
    try:
        access, refresh = await AuthUseCases(session, cache).login(body.email, body.password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.message) from exc
    _set_refresh_cookie(response, refresh)
    return ok(
        TokenResponse(
            access_token=access,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )
    )


@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
async def refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[TokenResponse]:
    settings = get_settings()
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")
    try:
        access, new_refresh = await AuthUseCases(session, cache).refresh(refresh_token)
    except AuthError as exc:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.message) from exc
    _set_refresh_cookie(response, new_refresh)
    return ok(
        TokenResponse(
            access_token=access,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )
    )


@router.post("/logout", response_model=ResponseEnvelope[MessageResponse])
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[MessageResponse]:
    settings = get_settings()
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    await AuthUseCases(session, cache).logout(refresh_token)
    _clear_refresh_cookie(response)
    return ok(MessageResponse(message="Logged out"))


@router.post("/forgot-password", response_model=ResponseEnvelope[MessageResponse])
async def forgot_password(
    body: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[MessageResponse]:
    await AuthUseCases(session, cache).forgot_password(body.email)
    return ok(MessageResponse(message="If the e-mail exists, a reset link was sent"))


@router.post("/reset-password", response_model=ResponseEnvelope[MessageResponse])
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[MessageResponse]:
    try:
        await AuthUseCases(session, cache).reset_password(body.token, body.new_password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    return ok(MessageResponse(message="Password updated"))
