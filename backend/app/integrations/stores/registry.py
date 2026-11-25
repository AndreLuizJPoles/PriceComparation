"""Adapter registry driven by settings."""

from app.core.settings import Settings, get_settings
from app.integrations.stores.amazon import AmazonAdapter
from app.integrations.stores.base import StoreAdapter
from app.integrations.stores.casasbahia import CasasBahiaAdapter
from app.integrations.stores.demo.adapter import DemoStoreAdapter
from app.integrations.stores.kabum import KabumAdapter
from app.integrations.stores.magalu import MagaluAdapter
from app.integrations.stores.mercadolivre import MercadoLivreAdapter

_ALL_ADAPTERS: dict[str, type[StoreAdapter]] = {
    "demo": DemoStoreAdapter,
    "amazon": AmazonAdapter,
    "mercadolivre": MercadoLivreAdapter,
    "magalu": MagaluAdapter,
    "kabum": KabumAdapter,
    "casasbahia": CasasBahiaAdapter,
}


class AdapterRegistry:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._adapters: dict[str, StoreAdapter] = {}
        for slug, cls in _ALL_ADAPTERS.items():
            adapter = cls()
            self._adapters[slug] = adapter

    def enabled_adapters(self) -> list[StoreAdapter]:
        enabled: list[StoreAdapter] = []
        for slug in self._settings.enabled_store_adapters:
            adapter = self._adapters.get(slug)
            if adapter and adapter.is_enabled:
                enabled.append(adapter)
        return enabled

    def get(self, slug: str) -> StoreAdapter | None:
        return self._adapters.get(slug)

    def all_adapters(self) -> list[StoreAdapter]:
        return list(self._adapters.values())


_registry: AdapterRegistry | None = None


def get_adapter_registry(settings: Settings | None = None) -> AdapterRegistry:
    global _registry
    if _registry is None:
        _registry = AdapterRegistry(settings)
    return _registry


def get_enabled_adapters(settings: Settings | None = None) -> list[StoreAdapter]:
    return get_adapter_registry(settings).enabled_adapters()