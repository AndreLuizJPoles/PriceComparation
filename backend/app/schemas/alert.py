"""Price alert DTOs."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.product import ProductOut


class PriceAlertCreateRequest(BaseModel):
    product_id: UUID
    target_price: Decimal = Field(gt=0, decimal_places=2)


class PriceAlertUpdateRequest(BaseModel):
    target_price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    is_active: bool | None = None


class PriceAlertOut(BaseModel):
    id: UUID
    product: ProductOut
    target_price: Decimal
    is_active: bool
    last_triggered_at: datetime | None