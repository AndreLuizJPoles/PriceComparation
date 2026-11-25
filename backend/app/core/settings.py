"""Application settings loaded from environment via pydantic-settings."""

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the Price Comparator API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="Price Comparator", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    demo_mode: bool = Field(default=True, alias="DEMO_MODE")

    backend_host: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"],
        alias="CORS_ORIGINS",
    )

    database_url: str = Field(
        default="postgresql+asyncpg://pricecomp:pricecomp_dev_change_me@localhost:5432/pricecomp",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        alias="CELERY_BROKER_URL",
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2",
        alias="CELERY_RESULT_BACKEND",
    )
    price_refresh_interval_minutes: int = Field(
        default=60,
        alias="PRICE_REFRESH_INTERVAL_MINUTES",
    )

    jwt_secret_key: str = Field(
        default="change-me-to-a-long-random-string-in-production",
        alias="JWT_SECRET_KEY",
    )
    jwt_access_token_expire_minutes: int = Field(
        default=15,
        alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7,
        alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS",
    )
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")

    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")

    refresh_cookie_name: str = Field(default="refresh_token", alias="REFRESH_COOKIE_NAME")
    password_reset_token_expire_minutes: int = Field(
        default=30,
        alias="PASSWORD_RESET_TOKEN_EXPIRE_MINUTES",
    )
    search_cache_ttl_seconds: int = Field(default=300, alias="SEARCH_CACHE_TTL_SECONDS")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    enabled_store_adapters: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["demo"],
        alias="ENABLED_STORE_ADAPTERS",
    )

    @field_validator("enabled_store_adapters", mode="before")
    @classmethod
    def parse_enabled_adapters(cls, value: object) -> object:
        if isinstance(value, str):
            return [slug.strip() for slug in value.split(",") if slug.strip()]
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
