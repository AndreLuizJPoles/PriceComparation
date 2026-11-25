"""Product endpoints."""

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.product_use_cases import ProductUseCases
from app.core.deps import get_cache, get_session
from app.infrastructure.redis_client import CacheService
from app.schemas.envelope import ResponseEnvelope, ok
from app.schemas.product import ComparisonOut, PriceHistoryPointOut, ProductDetailOut, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ResponseEnvelope[list[ProductOut]])
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[list[ProductOut]]:
    items, meta = await ProductUseCases(session, cache).list_products(page, page_size)
    return ok(items, meta=meta)


@router.get("/search", response_model=ResponseEnvelope[list[ProductOut]])
async def search_products(
    q: str = Query(min_length=1, max_length=256),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    category: str | None = None,
    store: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = Query(default="relevance"),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[list[ProductOut]]:
    items, meta = await ProductUseCases(session, cache).search(
        q,
        page,
        page_size,
        category=category,
        store=store,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
    )
    return ok(items, meta=meta)


@router.get("/{product_id}", response_model=ResponseEnvelope[ProductDetailOut])
async def get_product(
    product_id: UUID,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[ProductDetailOut]:
    product = await ProductUseCases(session, cache).get_product(product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ok(product)


@router.get("/{product_id}/offers", response_model=ResponseEnvelope[ComparisonOut])
async def get_product_offers(
    product_id: UUID,
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[ComparisonOut]:
    product = await ProductUseCases(session, cache).get_product(product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    _, comparison = await ProductUseCases(session, cache).get_offers(product_id)
    if comparison.best_offer:
        for offer in comparison.offers:
            offer.is_best = offer.id == comparison.best_offer.id
    return ok(comparison)


@router.get("/{product_id}/price-history", response_model=ResponseEnvelope[dict])
async def get_price_history(
    product_id: UUID,
    period: str = Query(default="30d", pattern="^(7d|30d|90d|1y)$"),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[dict]:
    product = await ProductUseCases(session, cache).get_product(product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    points, stats = await ProductUseCases(session, cache).get_price_history(product_id, period)
    return ok(
        {
            "period": period,
            "points": [p.model_dump(mode="json") for p in points],
            "stats": {k: (str(v) if v is not None else None) for k, v in stats.items()},
        }
    )
