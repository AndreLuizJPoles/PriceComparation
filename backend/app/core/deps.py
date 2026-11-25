"""Backward-compatible dependency aliases."""

from app.core.dependencies import (
    get_cache_service as get_cache,
    get_current_user,
    get_current_user_optional as get_optional_user,
    get_session,
)

__all__ = [
    "get_cache",
    "get_current_user",
    "get_optional_user",
    "get_session",
]
