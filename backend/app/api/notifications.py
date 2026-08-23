from fastapi import APIRouter, Depends
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Notification]:
    result = await db.execute(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50))
    return list(result.scalars().all())


@router.get("/unread-count")
async def unread_count(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    count = (await db.execute(select(func.count()).select_from(Notification).where(Notification.user_id == user.id, Notification.read.is_(False)))).scalar_one()
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(notification_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Notification:
    item = await db.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        raise NotFoundError("Notification not found.")
    item.read = True
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/read-all", status_code=204)
async def mark_all_read(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    await db.execute(update(Notification).where(Notification.user_id == user.id, Notification.read.is_(False)).values(read=True))
    await db.commit()