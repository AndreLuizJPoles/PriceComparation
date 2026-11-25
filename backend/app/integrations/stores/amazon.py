"""Amazon BR stub — disabled until official Creators/Associates API credentials exist."""

from app.integrations.stores.base import AdapterHealth, NormalizedOffer, StoreAdapter


class AmazonAdapter(StoreAdapter):
    store_slug = "amazon"
    is_enabled = False
    is_demo = False

    async def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        return []

    async def get_product(self, external_id: str) -> NormalizedOffer | None:
        return None

    async def health(self) -> AdapterHealth:
        return AdapterHealth(status="disabled", message="Amazon adapter stub; not enabled")