"""Product, store, and offer queries."""

import math
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductIdentifier
from app.models.store import PriceHistory, PriceOffer, Store, StoreProduct


class ProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search_products(
        self,
        query: str,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[Product], int]:
        needle = f"%{query.strip().lower()}%"
        filters = or_(
            func.lower(Product.name).like(needle),
            func.lower(Product.brand).like(needle),
            func.lower(Product.model).like(needle),
            func.lower(Product.category).like(needle),
        )
        count_stmt = select(func.count()).select_from(Product).where(filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())
        stmt = (
            select(Product)
            .where(filters)
            .order_by(Product.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def list_products(self, *, page: int, page_size: int) -> tuple[list[Product], int]:
        count_stmt = select(func.count()).select_from(Product)
        total = int((await self._session.execute(count_stmt)).scalar_one())
        stmt = (
            select(Product).order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_product(self, product_id: uuid.UUID) -> Product | None:
        stmt = (
            select(Product)
            .options(selectinload(Product.identifiers))
            .where(Product.id == product_id)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_canonical_key(self, canonical_key: str) -> Product | None:
        result = await self._session.execute(
            select(Product).where(Product.canonical_key == canonical_key),
        )
        return result.scalar_one_or_none()

    async def list_match_candidates(self, limit: int = 500) -> list[Product]:
        result = await self._session.execute(select(Product).limit(limit))
        return list(result.scalars().all())

    async def create_product(self, **kwargs: object) -> Product:
        product = Product(**kwargs)  # type: ignore[arg-type]
        self._session.add(product)
        await self._session.flush()
        return product

    async def add_identifier(self, product_id: uuid.UUID, id_type: str, value: str) -> ProductIdentifier:
        identifier = ProductIdentifier(product_id=product_id, type=id_type, value=value)
        self._session.add(identifier)
        await self._session.flush()
        return identifier

    async def get_store_by_slug(self, slug: str) -> Store | None:
        result = await self._session.execute(select(Store).where(Store.slug == slug))
        return result.scalar_one_or_none()

    async def ensure_store(self, slug: str, name: str, *, is_demo: bool) -> Store:
        existing = await self.get_store_by_slug(slug)
        if existing:
            return existing
        store = Store(
            slug=slug,
            name=name,
            website_url=f"https://{slug}.demo.local",
            is_active=True,
            is_demo=is_demo,
            reliability_tier="demo" if is_demo else "unknown",
        )
        self._session.add(store)
        await self._session.flush()
        return store

    async def get_store_product(
        self,
        store_id: uuid.UUID,
        external_id: str,
    ) -> StoreProduct | None:
        result = await self._session.execute(
            select(StoreProduct).where(
                StoreProduct.store_id == store_id,
                StoreProduct.external_id == external_id,
            ),
        )
        return result.scalar_one_or_none()

    async def create_store_product(self, **kwargs: object) -> StoreProduct:
        sp = StoreProduct(**kwargs)  # type: ignore[arg-type]
        self._session.add(sp)
        await self._session.flush()
        return sp

    async def add_price_offer(self, **kwargs: object) -> PriceOffer:
        offer = PriceOffer(**kwargs)  # type: ignore[arg-type]
        self._session.add(offer)
        await self._session.flush()
        return offer

    async def add_price_history(self, **kwargs: object) -> PriceHistory:
        point = PriceHistory(**kwargs)  # type: ignore[arg-type]
        self._session.add(point)
        await self._session.flush()
        return point

    async def get_offers_for_product(self, product_id: uuid.UUID) -> list[tuple[PriceOffer, Store, StoreProduct]]:
        stmt = (
            select(PriceOffer, Store, StoreProduct)
            .join(StoreProduct, PriceOffer.store_product_id == StoreProduct.id)
            .join(Store, StoreProduct.store_id == Store.id)
            .where(StoreProduct.product_id == product_id)
            .order_by(PriceOffer.total_price)
        )
        result = await self._session.execute(stmt)
        return list(result.all())

    async def get_price_history(
        self,
        product_id: uuid.UUID,
        period_days: int,
    ) -> list[PriceHistory]:
        since = datetime.now(UTC) - timedelta(days=period_days)
        stmt = (
            select(PriceHistory)
            .join(StoreProduct, PriceHistory.store_product_id == StoreProduct.id)
            .where(StoreProduct.product_id == product_id, PriceHistory.observed_at >= since)
            .order_by(PriceHistory.observed_at)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    def total_pages(total: int, page_size: int) -> int:
        if total == 0:
            return 0
        return math.ceil(total / page_size)