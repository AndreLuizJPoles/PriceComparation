"""Price alert use cases."""

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.alert_repository import AlertRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.alert import PriceAlertOut
from app.schemas.product import ProductOut


class AlertsUseCases:
    def __init__(self, session: AsyncSession) -> None:
        self._alerts = AlertRepository(session)
        self._products = ProductRepository(session)

    async def list_alerts(self, user_id: uuid.UUID) -> list[PriceAlertOut]:
        rows = await self._alerts.list_for_user(user_id)
        return [self._to_out(row) for row in rows]

    async def create(
        self,
        user_id: uuid.UUID,
        product_id: uuid.UUID,
        target_price: Decimal,
    ) -> PriceAlertOut | None:
        if not await self._products.get_product(product_id):
            return None
        row = await self._alerts.create(user_id, product_id, float(target_price))
        loaded = await self._alerts.get_by_id(row.id, user_id)
        return self._to_out(loaded) if loaded else None

    async def update(
        self,
        user_id: uuid.UUID,
        alert_id: uuid.UUID,
        *,
        target_price: Decimal | None,
        is_active: bool | None,
    ) -> PriceAlertOut | None:
        alert = await self._alerts.get_by_id(alert_id, user_id)
        if not alert:
            return None
        if target_price is not None:
            alert.target_price = float(target_price)
        if is_active is not None:
            alert.is_active = is_active
        await self._alerts.update(alert)
        loaded = await self._alerts.get_by_id(alert_id, user_id)
        return self._to_out(loaded) if loaded else None

    async def delete(self, user_id: uuid.UUID, alert_id: uuid.UUID) -> bool:
        alert = await self._alerts.get_by_id(alert_id, user_id)
        if not alert:
            return False
        await self._alerts.delete(alert)
        return True

    @staticmethod
    def _to_out(row: object) -> PriceAlertOut:
        from app.models.engagement import PriceAlert

        assert isinstance(row, PriceAlert)
        return PriceAlertOut(
            id=row.id,
            product=ProductOut.model_validate(row.product),
            target_price=Decimal(str(row.target_price)),
            is_active=row.is_active,
            last_triggered_at=row.last_triggered_at,
        )