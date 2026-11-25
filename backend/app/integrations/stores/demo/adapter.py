"""Active demo store adapter backed by local JSON fixtures."""

import json
from decimal import Decimal
from pathlib import Path

from app.integrations.stores.base import AdapterHealth, NormalizedOffer, StoreAdapter

FIXTURES_PATH = Path(__file__).parent / "fixtures.json"


def _load_offers() -> list[NormalizedOffer]:
    raw = json.loads(FIXTURES_PATH.read_text(encoding="utf-8"))
    offers: list[NormalizedOffer] = []
    for item in raw["offers"]:
        offers.append(
            NormalizedOffer(
                store_slug=item["store_slug"],
                external_id=item["external_id"],
                name=item["name"],
                brand=item.get("brand"),
                model=item.get("model"),
                category=item.get("category"),
                description=item.get("description"),
                image_url=item.get("image_url"),
                ean=item.get("ean"),
                url=item.get("url"),
                original_price=Decimal(item["original_price"]),
                promotional_price=(
                    Decimal(item["promotional_price"]) if item.get("promotional_price") else None
                ),
                shipping_price=Decimal(item["shipping_price"]),
                total_price=Decimal(item["total_price"]),
                currency=item.get("currency", "BRL"),
                availability=item.get("availability", "in_stock"),
                is_demo=True,
            )
        )
    return offers


class DemoStoreAdapter(StoreAdapter):
    store_slug = "demo"
    is_enabled = True
    is_demo = True

    def __init__(self) -> None:
        self._offers = _load_offers()

    async def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        needle = query.lower().strip()
        if not needle:
            return []
        matches = [
            offer
            for offer in self._offers
            if needle in offer.name.lower()
            or (offer.brand and needle in offer.brand.lower())
            or (offer.model and needle in offer.model.lower())
        ]
        return matches[:limit]

    async def get_product(self, external_id: str) -> NormalizedOffer | None:
        for offer in self._offers:
            if offer.external_id == external_id:
                return offer
        return None

    async def list_all(self) -> list[NormalizedOffer]:
        return list(self._offers)

    async def health(self) -> AdapterHealth:
        return AdapterHealth(status="ok", message="Demo adapter with fixture data")