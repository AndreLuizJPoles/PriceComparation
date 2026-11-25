"""Product search, comparison, and history use cases."""

import json
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import Settings, get_settings
from app.domain.matching import MatchCandidate, build_canonical_key, match_product
from app.domain.price_comparison import pick_best_offer
from app.infrastructure.redis_client import CacheService
from app.integrations.stores.base import NormalizedOffer
from app.integrations.stores.registry import get_enabled_adapters
from app.repositories.product_repository import ProductRepository
from app.schemas.envelope import PaginationMeta, ResponseMeta
from app.schemas.product import (
    ComparisonOut,
    PriceHistoryPointOut,
    PriceOfferOut,
    ProductDetailOut,
    ProductIdentifierOut,
    ProductOut,
)


PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}


class ProductUseCases:
    def __init__(
        self,
        session: AsyncSession,
        cache: CacheService | None = None,
        settings: Settings | None = None,
    ) -> None:
        self._session = session
        self._repo = ProductRepository(session)
        self._cache = cache or CacheService()
        self._settings = settings or get_settings()

    async def list_products(self, page: int, page_size: int) -> tuple[list[ProductOut], ResponseMeta]:
        products, total = await self._repo.list_products(page=page, page_size=page_size)
        items = [await self._to_product_out(p) for p in products]
        return items, self._pagination_meta(page, page_size, total)

    async def search(
        self,
        query: str,
        page: int,
        page_size: int,
        *,
        category: str | None = None,
        store: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        sort: str = "relevance",
    ) -> tuple[list[ProductOut], ResponseMeta]:
        cache_key = (
            f"search:{query.lower()}:{page}:{page_size}:{category}:{store}:{min_price}:{max_price}:{sort}"
        )
        try:
            cached = await self._cache.get(cache_key)
            if cached:
                payload = json.loads(cached)
                items = [ProductOut.model_validate(item) for item in payload["items"]]
                meta = ResponseMeta.model_validate(payload["meta"])
                return items, meta
        except Exception:
            pass

        products, total = await self._repo.search_products(query, page=page, page_size=page_size)
        if total == 0:
            await self._ingest_from_adapters(query)
            products, total = await self._repo.search_products(query, page=page, page_size=page_size)

        items = [await self._to_product_out(p) for p in products]
        if category:
            items = [i for i in items if i.category and i.category.lower() == category.lower()]
        if min_price is not None:
            items = [i for i in items if i.best_price is not None and i.best_price >= min_price]
        if max_price is not None:
            items = [i for i in items if i.best_price is not None and i.best_price <= max_price]
        if store:
            filtered: list[ProductOut] = []
            for item in items:
                offers, _ = await self.get_offers(item.id)
                if any(o.store_slug == store for o in offers):
                    filtered.append(item)
            items = filtered

        if sort == "price_asc":
            items.sort(key=lambda i: i.best_price or Decimal("999999"))
        elif sort == "price_desc":
            items.sort(key=lambda i: i.best_price or Decimal("0"), reverse=True)
        elif sort == "name_asc":
            items.sort(key=lambda i: i.name.lower())

        meta = self._pagination_meta(page, page_size, total)
        try:
            await self._cache.set(
                cache_key,
                json.dumps(
                    {
                        "items": [i.model_dump(mode="json") for i in items],
                        "meta": meta.model_dump(mode="json"),
                    }
                ),
                self._settings.search_cache_ttl_seconds,
            )
        except Exception:
            pass
        return items, meta

    async def get_product(self, product_id: uuid.UUID) -> ProductDetailOut | None:
        product = await self._repo.get_product(product_id)
        if product is None:
            return None
        base = await self._to_product_out(product)
        return ProductDetailOut(
            **base.model_dump(),
            identifiers=[
                ProductIdentifierOut(type=i.type, value=i.value) for i in product.identifiers
            ],
        )

    async def get_offers(self, product_id: uuid.UUID) -> tuple[list[PriceOfferOut], ComparisonOut]:
        rows = await self._repo.get_offers_for_product(product_id)
        offers: list[PriceOfferOut] = []
        for offer, store, store_product in rows:
            offers.append(
                PriceOfferOut(
                    id=offer.id,
                    store_slug=store.slug,
                    store_name=store.name,
                    original_price=Decimal(str(offer.original_price)),
                    promotional_price=(
                        Decimal(str(offer.promotional_price))
                        if offer.promotional_price is not None
                        else None
                    ),
                    shipping_price=Decimal(str(offer.shipping_price)),
                    total_price=Decimal(str(offer.total_price)),
                    currency=offer.currency,
                    is_demo=offer.is_demo,
                    observed_at=offer.observed_at,
                    product_url=store_product.url,
                    availability=store_product.availability,
                    last_checked_at=store_product.last_checked_at,
                )
            )
        best = pick_best_offer(offers)
        savings = None
        if offers and best:
            worst = max(offers, key=lambda o: o.total_price)
            savings = worst.total_price - best.total_price
        comparison = ComparisonOut(
            best_offer=best,
            offers=offers,
            match_confidence=None,
            savings_vs_worst=savings,
        )
        return offers, comparison

    async def get_price_history(
        self,
        product_id: uuid.UUID,
        period: str,
    ) -> tuple[list[PriceHistoryPointOut], dict[str, Decimal | None]]:
        days = PERIOD_DAYS.get(period, 30)
        points = await self._repo.get_price_history(product_id, days)
        out = [
            PriceHistoryPointOut(
                observed_at=p.observed_at,
                total_price=Decimal(str(p.total_price)),
                promotional_price=(
                    Decimal(str(p.promotional_price)) if p.promotional_price is not None else None
                ),
                shipping_price=Decimal(str(p.shipping_price)),
            )
            for p in points
        ]
        if not out:
            return out, {"min": None, "max": None, "avg": None}
        totals = [p.total_price for p in out]
        stats = {
            "min": min(totals),
            "max": max(totals),
            "avg": sum(totals) / Decimal(len(totals)),
        }
        return out, stats

    async def _ingest_from_adapters(self, query: str) -> None:
        adapters = get_enabled_adapters(self._settings)
        existing = await self._repo.list_match_candidates()
        candidates = [
            MatchCandidate(
                product_id=str(p.id),
                canonical_key=p.canonical_key,
                name=p.name,
                brand=p.brand,
                model=p.model,
                ean=next((i.value for i in getattr(p, "identifiers", []) if i.type == "ean"), None),
            )
            for p in existing
        ]
        for adapter in adapters:
            offers = await adapter.search(query, limit=20)
            for offer in offers:
                await self._upsert_offer(offer, candidates)

    async def _ingest_offer(
        self,
        offer: NormalizedOffer,
        match_confidence: float = 1.0,
        candidates: list[MatchCandidate] | None = None,
    ) -> None:
        _ = match_confidence
        if candidates is None:
            existing = await self._repo.list_match_candidates()
            candidates = [
                MatchCandidate(
                    product_id=str(p.id),
                    canonical_key=p.canonical_key,
                    name=p.name,
                    brand=p.brand,
                    model=p.model,
                    ean=None,
                )
                for p in existing
            ]
        await self._upsert_offer(offer, candidates)

    async def _upsert_offer(
        self,
        offer: NormalizedOffer,
        candidates: list[MatchCandidate],
    ) -> None:
        incoming = MatchCandidate(
            product_id=None,
            canonical_key=build_canonical_key(offer.brand, offer.model, offer.name),
            name=offer.name,
            brand=offer.brand,
            model=offer.model,
            ean=offer.ean,
        )
        match = match_product(incoming, candidates)
        if match.matched_product_id:
            product = await self._repo.get_product(uuid.UUID(match.matched_product_id))
            if product is None:
                return
        else:
            product = await self._repo.create_product(
                name=offer.name,
                brand=offer.brand,
                model=offer.model,
                category=offer.category,
                description=offer.description,
                image_url=offer.image_url,
                canonical_key=incoming.canonical_key + f"|{offer.store_slug}|{offer.external_id}",
            )
            if offer.ean:
                await self._repo.add_identifier(product.id, "ean", offer.ean)
            candidates.append(
                MatchCandidate(
                    product_id=str(product.id),
                    canonical_key=product.canonical_key,
                    name=product.name,
                    brand=product.brand,
                    model=product.model,
                    ean=offer.ean,
                )
            )

        store = await self._repo.ensure_store(
            offer.store_slug,
            offer.store_slug.replace("-", " ").title(),
            is_demo=offer.is_demo,
        )
        store_product = await self._repo.get_store_product(store.id, offer.external_id)
        now = datetime.now(UTC)
        if store_product is None:
            store_product = await self._repo.create_store_product(
                product_id=product.id,
                store_id=store.id,
                external_id=offer.external_id,
                url=offer.url,
                availability=offer.availability,
                last_checked_at=now,
            )
        else:
            store_product.url = offer.url
            store_product.availability = offer.availability
            store_product.last_checked_at = now

        await self._repo.add_price_offer(
            store_product_id=store_product.id,
            original_price=offer.original_price,
            promotional_price=offer.promotional_price,
            shipping_price=offer.shipping_price,
            total_price=offer.total_price,
            currency=offer.currency,
            is_demo=offer.is_demo,
            observed_at=now,
        )
        await self._repo.add_price_history(
            store_product_id=store_product.id,
            total_price=offer.total_price,
            promotional_price=offer.promotional_price,
            shipping_price=offer.shipping_price,
            observed_at=now,
        )
        # Seed a few historical points for demo charts
        if offer.is_demo:
            for days_ago, factor in ((6, "1.08"), (14, "1.12"), (21, "0.97"), (28, "1.05")):
                await self._repo.add_price_history(
                    store_product_id=store_product.id,
                    total_price=(offer.total_price * Decimal(factor)).quantize(Decimal("0.01")),
                    promotional_price=offer.promotional_price,
                    shipping_price=offer.shipping_price,
                    observed_at=now - timedelta(days=days_ago),
                )

    async def _to_product_out(self, product) -> ProductOut:
        rows = await self._repo.get_offers_for_product(product.id)
        best_price = None
        is_demo = True
        if rows:
            best_price = min(Decimal(str(r[0].total_price)) for r in rows)
            is_demo = any(r[0].is_demo for r in rows)
        return ProductOut(
            id=product.id,
            name=product.name,
            brand=product.brand,
            model=product.model,
            category=product.category,
            description=product.description,
            image_url=product.image_url,
            canonical_key=product.canonical_key,
            is_demo=is_demo,
            best_price=best_price,
        )

    @staticmethod
    def _pagination_meta(page: int, page_size: int, total: int) -> ResponseMeta:
        return ResponseMeta(
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=ProductRepository.total_pages(total, page_size),
            ),
            is_demo=True,
            demo_banner="Dados de demonstração",
        )
