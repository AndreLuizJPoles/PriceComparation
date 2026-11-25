"""Favorites endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.product_use_cases import ProductUseCases
from app.core.deps import get_cache, get_current_user, get_session
from app.infrastructure.redis_client import CacheService
from app.models.user import User
from app.repositories.favorite_repository import FavoriteRepository
from app.schemas.envelope import ResponseEnvelope, ok
from app.schemas.favorite import FavoriteCreateRequest, FavoriteOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=ResponseEnvelope[list[FavoriteOut]])
async def list_favorites(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[list[FavoriteOut]]:
    favorites = await FavoriteRepository(session).list_for_user(user.id)
    product_uc = ProductUseCases(session, cache)
    out: list[FavoriteOut] = []
    for fav in favorites:
        product = await product_uc.get_product(fav.product_id)
        if product:
            out.append(FavoriteOut(id=fav.id, product=product))
    return ok(out)


@router.post("", response_model=ResponseEnvelope[FavoriteOut], status_code=status.HTTP_201_CREATED)
async def add_favorite(
    body: FavoriteCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[FavoriteOut]:
    product = await ProductUseCases(session, cache).get_product(body.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    fav = await FavoriteRepository(session).add(user.id, body.product_id)
    return ok(FavoriteOut(id=fav.id, product=product))


@router.delete("/{product_id}", response_model=ResponseEnvelope[dict])
async def remove_favorite(
    product_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ResponseEnvelope[dict]:
    removed = await FavoriteRepository(session).remove(user.id, product_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    return ok({"removed": True})
