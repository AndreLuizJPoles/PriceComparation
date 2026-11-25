"""Product and offer DTOs."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ProductIdentifierOut(BaseModel):
    type: str
    value: str


class ProductOut(BaseModel):
    id: UUID
    name: str
    brand: str | None
    model: str | None
    category: str | None
    description: str | None
    image_url: str | None
    canonical_key: str
    is_demo: bool = True
    best_price: Decimal | None = None
    currency: str = "BRL"


class ProductDetailOut(ProductOut):
    identifiers: list[ProductIdentifierOut] = Field(default_factory=list)


class PriceOfferOut(BaseModel):
    id: UUID
    store_slug: str
    store_name: str
    original_price: Decimal
    promotional_price: Decimal | None
    shipping_price: Decimal
    total_price: Decimal
    currency: str
    is_demo: bool
    observed_at: datetime
    product_url: str | None = None
    availability: str = "in_stock"
    last_checked_at: datetime | None = None
    is_best: bool = False


class PriceHistoryPointOut(BaseModel):
    observed_at: datetime
    total_price: Decimal
    promotional_price: Decimal | None
    shipping_price: Decimal


class ComparisonOut(BaseModel):
    best_offer: PriceOfferOut | None
    offers: list[PriceOfferOut]
    match_confidence: float | None = None
    savings_vs_worst: Decimal | None = None


class SearchQueryParams(BaseModel):
    q: str = Field(min_length=1, max_length=256)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)