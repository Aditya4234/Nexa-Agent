from datetime import datetime
from typing import Any

from pydantic import BaseModel


class MessageRead(BaseModel):
    id: int
    role: str
    content: str
    event_type: str
    metadata_: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationRead(BaseModel):
    id: int
    title: str
    model: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationRead):
    messages: list[MessageRead] = []


class ConversationUpdate(BaseModel):
    title: str | None = None