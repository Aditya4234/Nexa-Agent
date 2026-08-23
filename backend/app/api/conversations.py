from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.agent import AgentRun
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.conversation import ConversationDetail, ConversationRead

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationRead])
async def list_conversations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Conversation]:
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc()).limit(100)
    )
    return list(result.scalars().all())


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Conversation:
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user.id))).scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found.")
    await db.refresh(conv, ["messages"])
    return conv


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user.id))).scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found.")
    await db.delete(conv)
    await db.commit()