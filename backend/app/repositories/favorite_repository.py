"""Favorite persistence."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.engagement import Favorite


class FavoriteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: uuid.UUID) -> list[Favorite]:
        stmt = (
            select(Favorite)
            .options(selectinload(Favorite.product))
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get(self, user_id: uuid.UUID, product_id: uuid.UUID) -> Favorite | None:
        result = await self._session.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.product_id == product_id),
        )
        return result.scalar_one_or_none()

    async def add(self, user_id: uuid.UUID, product_id: uuid.UUID) -> Favorite:
        existing = await self.get(user_id, product_id)
        if existing:
            return existing
        fav = Favorite(user_id=user_id, product_id=product_id)
        self._session.add(fav)
        await self._session.flush()
        return fav

    async def remove(self, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        fav = await self.get(user_id, product_id)
        if fav is None:
            return False
        await self._session.delete(fav)
        await self._session.flush()
        return True
