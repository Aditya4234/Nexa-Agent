import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.api_keys import _hash, _public
from app.api.deps import get_current_user
from app.core.exceptions import AuthError, ConflictError
from app.db import get_db
from app.models.api_key import ApiKey
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.security.jwt import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _token_for(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user.id), {"role": user.role}),
        user=UserRead.model_validate(user).model_dump(),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise ConflictError("An account with this email already exists.")
    user = User(email=body.email, full_name=body.full_name, hashed_password=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    raw_key = "nx-" + secrets.token_urlsafe(32)
    db.add(ApiKey(user_id=user.id, name="Default key", key_hash=_hash(raw_key), prefix=_public(raw_key)))
    await db.commit()

    token = await _token_for(user)
    token.api_key = raw_key
    return token


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise AuthError("Invalid email or password.")
    if not user.is_active:
        raise AuthError("Account is disabled.")
    return await _token_for(user)


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> User:
    return user