"""Authentication use cases."""

import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import Settings, get_settings
from app.infrastructure.email import EmailPort, get_email_port
from app.infrastructure.jwt import TokenError, create_access_token, create_refresh_jti, decode_token
from app.infrastructure.password import hash_password, verify_password
from app.infrastructure.redis_client import CacheService
from app.repositories.user_repository import UserRepository


class AuthError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


class AuthUseCases:
    def __init__(
        self,
        session: AsyncSession,
        cache: CacheService | None = None,
        email_port: EmailPort | None = None,
        settings: Settings | None = None,
    ) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._cache = cache or CacheService()
        self._email = email_port or get_email_port()
        self._settings = settings or get_settings()

    async def register(self, email: str, password: str, name: str) -> tuple[str, str]:
        if await self._users.get_by_email(email):
            raise AuthError("email_taken", "E-mail already registered")
        user = await self._users.create(email, hash_password(password), name)
        access = create_access_token(str(user.id), settings=self._settings)
        jti = create_refresh_jti()
        expires = datetime.now(UTC) + timedelta(days=self._settings.jwt_refresh_token_expire_days)
        await self._users.save_refresh_token(user.id, jti, expires)
        refresh = self._encode_refresh(str(user.id), jti, expires)
        return access, refresh

    def _encode_refresh(self, subject: str, jti: str, expires: datetime) -> str:
        import jwt

        now = datetime.now(UTC)
        return jwt.encode(
            {
                "sub": subject,
                "type": "refresh",
                "jti": jti,
                "iat": int(now.timestamp()),
                "exp": int(expires.timestamp()),
            },
            self._settings.jwt_secret_key,
            algorithm=self._settings.jwt_algorithm,
        )

    async def login(self, email: str, password: str) -> tuple[str, str]:
        user = await self._users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthError("invalid_credentials", "Invalid e-mail or password")
        if not user.is_active:
            raise AuthError("user_inactive", "User account is inactive")
        access = create_access_token(str(user.id), settings=self._settings)
        jti = create_refresh_jti()
        expires = datetime.now(UTC) + timedelta(days=self._settings.jwt_refresh_token_expire_days)
        await self._users.save_refresh_token(user.id, jti, expires)
        refresh = self._encode_refresh(str(user.id), jti, expires)
        return access, refresh

    async def refresh(self, refresh_token: str) -> tuple[str, str]:
        try:
            payload = decode_token(refresh_token, settings=self._settings, expected_type="refresh")
        except TokenError as exc:
            raise AuthError("invalid_refresh", "Invalid refresh token") from exc
        jti = str(payload.get("jti", ""))
        token_row = await self._users.get_refresh_token(jti)
        if not token_row or token_row.revoked_at is not None:
            raise AuthError("invalid_refresh", "Refresh token revoked or missing")
        if token_row.expires_at < datetime.now(UTC):
            raise AuthError("invalid_refresh", "Refresh token expired")
        await self._users.revoke_refresh_token(token_row)
        user_id = uuid.UUID(str(payload["sub"]))
        access = create_access_token(str(user_id), settings=self._settings)
        new_jti = create_refresh_jti()
        expires = datetime.now(UTC) + timedelta(days=self._settings.jwt_refresh_token_expire_days)
        await self._users.save_refresh_token(user_id, new_jti, expires)
        new_refresh = self._encode_refresh(str(user_id), new_jti, expires)
        return access, new_refresh

    async def logout(self, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        try:
            payload = decode_token(refresh_token, settings=self._settings, expected_type="refresh")
        except TokenError:
            return
        jti = str(payload.get("jti", ""))
        token_row = await self._users.get_refresh_token(jti)
        if token_row and token_row.revoked_at is None:
            await self._users.revoke_refresh_token(token_row)

    async def forgot_password(self, email: str) -> None:
        user = await self._users.get_by_email(email)
        if not user:
            return
        token = secrets.token_urlsafe(32)
        await self._cache.set_password_reset_token(
            token,
            str(user.id),
            self._settings.password_reset_token_expire_minutes,
        )
        reset_url = f"http://localhost:5173/reset-password?token={token}"
        await self._email.send_password_reset(user.email, token, reset_url)

    async def reset_password(self, token: str, new_password: str) -> None:
        user_id = await self._cache.get_password_reset_user_id(token)
        if not user_id:
            raise AuthError("invalid_reset_token", "Reset token is invalid or expired")
        user = await self._users.get_by_id(uuid.UUID(user_id))
        if not user:
            raise AuthError("invalid_reset_token", "User not found")
        user.password_hash = hash_password(new_password)
        await self._users.update(user)
        await self._cache.delete_password_reset_token(token)