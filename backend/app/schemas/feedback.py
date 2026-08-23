from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    message_id: int | None = None
    run_id: str | None = None
    conversation_id: int | None = None
    feedback: str = Field(pattern="^(up|down)$")
    comment: str = ""


class FeedbackRead(BaseModel):
    id: int
    message_id: int | None
    run_id: str | None
    feedback: str
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackStats(BaseModel):
    up: int
    down: int