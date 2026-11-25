"""Store adapter contract."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class NormalizedOffer:
    store_slug: str
    external_id: str
    name: str
    brand: str | None
    model: str | None
    category: str | None
    description: str | None
    image_url: str | None
    ean: str | None
    url: str | None
    original_price: Decimal
    promotional_price: Decimal | None
    shipping_price: Decimal
    total_price: Decimal
    currency: str
    availability: str
    is_demo: bool


@dataclass(frozen=True)
class AdapterHealth:
    status: str
    message: str


class StoreAdapter(ABC):
    store_slug: str
    is_enabled: bool
    is_demo: bool

    @abstractmethod
    async def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        ...

    @abstractmethod
    async def get_product(self, external_id: str) -> NormalizedOffer | None:
        ...

    @abstractmethod
    async def health(self) -> AdapterHealth:
        ...