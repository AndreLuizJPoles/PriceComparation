"""KaBuM! stub — disabled until Awin product feed is configured."""

from app.integrations.stores.base import AdapterHealth, NormalizedOffer, StoreAdapter


class KabumAdapter(StoreAdapter):
    store_slug = "kabum"
    is_enabled = False
    is_demo = False

    async def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        return []

    async def get_product(self, external_id: str) -> NormalizedOffer | None:
        return None

    async def health(self) -> AdapterHealth:
        return AdapterHealth(status="disabled", message="KaBuM adapter stub; not enabled")