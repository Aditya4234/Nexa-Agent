import hashlib

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthError
from app.db import get_db
from app.models.api_key import ApiKey
from app.models.user import User
from app.security.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    request: Request = None,  # type: ignore[assignment]  # FastAPI auto-injects Request
) -> User:
    """Authenticates via JWT bearer token, falling back to an API key (X-API-Key header)."""
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = (await db.execute(select(User).where(User.id == int(payload["sub"])))).scalar_one_or_none()
            if user:
                return user
            raise AuthError("User no longer exists.")

    api_key = _extract_api_key(request)
    if api_key:
        user = await _user_from_api_key(db, api_key)
        if user:
            return user
        raise AuthError("Invalid API key.")

    raise AuthError()


async def _user_from_api_key(db: AsyncSession, key: str) -> User | None:
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    row = (await db.execute(select(ApiKey, User).join(User, User.id == ApiKey.user_id).where(ApiKey.key_hash == key_hash, ApiKey.revoked.is_(False)))).first()
    if not row:
        return None
    api_key, user = row
    from datetime import datetime, timezone

    api_key.last_used_at = datetime.now(timezone.utc)
    await db.commit()
    return user


def _extract_api_key(request: Request | None) -> str | None:
    if request is None:
        return None
    key = request.headers.get("x-api-key") or ""
    if not key and request.headers.get("authorization", "").lower().startswith("bearer "):
        # API keys use the `nx-` prefix; JWTs do not.
        candidate = request.headers["authorization"][7:].strip()
        if candidate.startswith("nx-"):
            return candidate
    return key.strip() or None


async def require_role(*roles: str):
    async def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            from app.core.exceptions import ForbiddenError

            raise ForbiddenError("Insufficient permissions.")
        return user

    return _checker