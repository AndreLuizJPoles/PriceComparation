"""Favorites use cases."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.favorite import FavoriteOut
from app.schemas.product import ProductOut


class FavoritesUseCases:
    def __init__(self, session: AsyncSession) -> None:
        self._favorites = FavoriteRepository(session)
        self._products = ProductRepository(session)

    async def list_favorites(self, user_id: uuid.UUID) -> list[FavoriteOut]:
        rows = await self._favorites.list_for_user(user_id)
        return [
            FavoriteOut(
                id=row.id,
                product=ProductOut(
                    id=row.product.id,
                    name=row.product.name,
                    brand=row.product.brand,
                    model=row.product.model,
                    category=row.product.category,
                    description=row.product.description,
                    image_url=row.product.image_url,
                    canonical_key=row.product.canonical_key,
                    is_demo=True,
                ),
            )
            for row in rows
        ]

    async def add(self, user_id: uuid.UUID, product_id: uuid.UUID) -> FavoriteOut | None:
        if not await self._products.get_product(product_id):
            return None
        existing = await self._favorites.get(user_id, product_id)
        if existing:
            fav = existing
        else:
            fav = await self._favorites.create(user_id, product_id)
        loaded = await self._favorites.get_by_id(fav.id, user_id)
        if not loaded:
            return None
        return FavoriteOut(
            id=loaded.id,
            product=ProductOut.model_validate(loaded.product),
        )

    async def remove(self, user_id: uuid.UUID, favorite_id: uuid.UUID) -> bool:
        fav = await self._favorites.get_by_id(favorite_id, user_id)
        if not fav:
            return False
        await self._favorites.delete(fav)
        return True