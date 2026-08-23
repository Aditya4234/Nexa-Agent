import hashlib
import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.api_key import ApiKey
from app.models.user import User
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreated, ApiKeyRead

router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])

KEY_PREFIX = "nx"


def _hash(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def _public(key: str) -> str:
    return f"{key[:10]}…{key[-4:]}"


@router.get("", response_model=list[ApiKeyRead])
async def list_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[ApiKey]:
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=ApiKeyCreated, status_code=201)
async def create_key(body: ApiKeyCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> ApiKeyCreated:
    raw = f"{KEY_PREFIX}-" + secrets.token_urlsafe(32)
    key = ApiKey(user_id=user.id, name=body.name or "Default key", key_hash=_hash(raw), prefix=_public(raw))
    db.add(key)
    await db.commit()
    await db.refresh(key)
    created = ApiKeyCreated.model_validate(key)
    created.key = raw
    return created


@router.delete("/{key_id}", status_code=204)
async def revoke_key(key_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    key = await db.get(ApiKey, key_id)
    if not key or key.user_id != user.id:
        raise NotFoundError("API key not found.")
    key.revoked = True
    await db.commit()