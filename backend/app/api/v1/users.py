"""User profile endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.envelope import ResponseEnvelope, ok
from app.schemas.user import UserOut, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=ResponseEnvelope[UserOut])
async def get_me(user: User = Depends(get_current_user)) -> ResponseEnvelope[UserOut]:
    return ok(UserOut.model_validate(user))


@router.patch("/me", response_model=ResponseEnvelope[UserOut])
async def update_me(
    body: UserUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ResponseEnvelope[UserOut]:
    if body.name is not None:
        user.name = body.name
    await UserRepository(session).update(user)
    return ok(UserOut.model_validate(user))
