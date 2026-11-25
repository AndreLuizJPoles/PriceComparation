"""Price alert persistence."""

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.engagement import PriceAlert


class AlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: uuid.UUID) -> list[PriceAlert]:
        stmt = (
            select(PriceAlert)
            .options(selectinload(PriceAlert.product))
            .where(PriceAlert.user_id == user_id)
            .order_by(PriceAlert.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get(self, alert_id: uuid.UUID, user_id: uuid.UUID) -> PriceAlert | None:
        result = await self._session.execute(
            select(PriceAlert)
            .options(selectinload(PriceAlert.product))
            .where(PriceAlert.id == alert_id, PriceAlert.user_id == user_id),
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: uuid.UUID,
        product_id: uuid.UUID,
        target_price: Decimal,
    ) -> PriceAlert:
        alert = PriceAlert(
            user_id=user_id,
            product_id=product_id,
            target_price=target_price,
            is_active=True,
        )
        self._session.add(alert)
        await self._session.flush()
        return alert

    async def update(
        self,
        alert: PriceAlert,
        *,
        target_price: Decimal | None = None,
        is_active: bool | None = None,
    ) -> PriceAlert:
        if target_price is not None:
            alert.target_price = target_price
        if is_active is not None:
            alert.is_active = is_active
        await self._session.flush()
        return alert

    async def delete(self, alert_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        alert = await self.get(alert_id, user_id)
        if alert is None:
            return False
        await self._session.delete(alert)
        await self._session.flush()
        return True

    async def list_active(self) -> list[PriceAlert]:
        stmt = (
            select(PriceAlert)
            .options(selectinload(PriceAlert.product))
            .where(PriceAlert.is_active.is_(True))
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
