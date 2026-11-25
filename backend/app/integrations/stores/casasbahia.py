"""Casas Bahia stub — disabled until Awin feed (PJ) is available."""

from app.integrations.stores.base import AdapterHealth, NormalizedOffer, StoreAdapter


class CasasBahiaAdapter(StoreAdapter):
    store_slug = "casasbahia"
    is_enabled = False
    is_demo = False

    async def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        return []

    async def get_product(self, external_id: str) -> NormalizedOffer | None:
        return None

    async def health(self) -> AdapterHealth:
        return AdapterHealth(status="disabled", message="Casas Bahia adapter stub; not enabled")