from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    icon: str = "📁"


class ProjectRead(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    created_at: datetime
    updated_at: datetime
    agent_count: int = 0
    conversation_count: int = 0

    model_config = {"from_attributes": True}


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None