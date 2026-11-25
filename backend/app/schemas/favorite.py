"""Favorite DTOs."""

from uuid import UUID

from pydantic import BaseModel

from app.schemas.product import ProductOut


class FavoriteCreateRequest(BaseModel):
    product_id: UUID


class FavoriteOut(BaseModel):
    id: UUID
    product: ProductOut