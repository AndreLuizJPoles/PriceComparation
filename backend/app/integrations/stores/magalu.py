"""Magazine Luiza stub — disabled (no public affiliate catalog API)."""

from app.integrations.stores.base import AdapterHealth, NormalizedOffer, StoreAdapter


class MagaluAdapter(StoreAdapter):
    store_slug = "magalu"
    is_enabled = False
    is_demo = False

    async def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        return []

    async def get_product(self, external_id: str) -> NormalizedOffer | None:
        return None

    async def health(self) -> AdapterHealth:
        return AdapterHealth(status="disabled", message="Magalu adapter stub; not enabled")