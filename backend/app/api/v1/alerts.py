"""Price alert endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.product_use_cases import ProductUseCases
from app.core.deps import get_cache, get_current_user, get_session
from app.infrastructure.redis_client import CacheService
from app.models.user import User
from app.repositories.alert_repository import AlertRepository
from app.schemas.alert import PriceAlertCreateRequest, PriceAlertOut, PriceAlertUpdateRequest
from app.schemas.envelope import ResponseEnvelope, ok

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=ResponseEnvelope[list[PriceAlertOut]])
async def list_alerts(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[list[PriceAlertOut]]:
    alerts = await AlertRepository(session).list_for_user(user.id)
    product_uc = ProductUseCases(session, cache)
    out: list[PriceAlertOut] = []
    for alert in alerts:
        product = await product_uc.get_product(alert.product_id)
        if product:
            out.append(
                PriceAlertOut(
                    id=alert.id,
                    product=product,
                    target_price=alert.target_price,
                    is_active=alert.is_active,
                    last_triggered_at=alert.last_triggered_at,
                )
            )
    return ok(out)


@router.post("", response_model=ResponseEnvelope[PriceAlertOut], status_code=status.HTTP_201_CREATED)
async def create_alert(
    body: PriceAlertCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[PriceAlertOut]:
    product = await ProductUseCases(session, cache).get_product(body.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    alert = await AlertRepository(session).create(user.id, body.product_id, body.target_price)
    return ok(
        PriceAlertOut(
            id=alert.id,
            product=product,
            target_price=alert.target_price,
            is_active=alert.is_active,
            last_triggered_at=alert.last_triggered_at,
        )
    )


@router.patch("/{alert_id}", response_model=ResponseEnvelope[PriceAlertOut])
async def update_alert(
    alert_id: UUID,
    body: PriceAlertUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    cache: CacheService = Depends(get_cache),
) -> ResponseEnvelope[PriceAlertOut]:
    repo = AlertRepository(session)
    alert = await repo.get(alert_id, user.id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert = await repo.update(alert, target_price=body.target_price, is_active=body.is_active)
    product = await ProductUseCases(session, cache).get_product(alert.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ok(
        PriceAlertOut(
            id=alert.id,
            product=product,
            target_price=alert.target_price,
            is_active=alert.is_active,
            last_triggered_at=alert.last_triggered_at,
        )
    )


@router.delete("/{alert_id}", response_model=ResponseEnvelope[dict])
async def delete_alert(
    alert_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ResponseEnvelope[dict]:
    removed = await AlertRepository(session).delete(alert_id, user.id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return ok({"removed": True})
