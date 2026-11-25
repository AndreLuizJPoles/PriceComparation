"""API response envelope."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ResponseMeta(BaseModel):
    pagination: PaginationMeta | None = None
    is_demo: bool = True
    demo_banner: str | None = "Dados de demonstração"


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, object] | None = None


class ResponseEnvelope(BaseModel, Generic[T]):
    data: T | None = None
    meta: ResponseMeta | None = None
    error: ErrorDetail | None = None


def ok(data: T, *, meta: ResponseMeta | None = None) -> ResponseEnvelope[T]:
    return ResponseEnvelope(data=data, meta=meta, error=None)


def fail(code: str, message: str, details: dict[str, object] | None = None) -> ResponseEnvelope[None]:
    return ResponseEnvelope(
        data=None,
        meta=None,
        error=ErrorDetail(code=code, message=message, details=details),
    )