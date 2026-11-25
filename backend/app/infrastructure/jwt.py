"""JWT creation and validation."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.settings import Settings, get_settings


class TokenError(Exception):
    pass


def create_access_token(
    subject: str,
    *,
    settings: Settings | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    cfg = settings or get_settings()
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=cfg.jwt_access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, cfg.jwt_secret_key, algorithm=cfg.jwt_algorithm)


def create_refresh_jti() -> str:
    return str(uuid.uuid4())


def decode_token(token: str, *, settings: Settings | None = None, expected_type: str) -> dict[str, Any]:
    cfg = settings or get_settings()
    try:
        payload = jwt.decode(token, cfg.jwt_secret_key, algorithms=[cfg.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid token") from exc
    if payload.get("type") != expected_type:
        raise TokenError("Invalid token type")
    return payload