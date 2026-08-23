from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db import get_db
from app.models.feedback import MessageFeedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackRead, FeedbackStats

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackRead, status_code=201)
async def create_feedback(body: FeedbackCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> MessageFeedback:
    feedback = MessageFeedback(user_id=user.id, **body.model_dump())
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.get("/stats", response_model=FeedbackStats)
async def feedback_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> FeedbackStats:
    up = (await db.execute(select(func.count()).select_from(MessageFeedback).where(MessageFeedback.user_id == user.id, MessageFeedback.feedback == "up"))).scalar_one()
    down = (await db.execute(select(func.count()).select_from(MessageFeedback).where(MessageFeedback.user_id == user.id, MessageFeedback.feedback == "down"))).scalar_one()
    return FeedbackStats(up=up, down=down)