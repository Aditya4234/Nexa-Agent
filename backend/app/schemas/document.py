from datetime import datetime

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255, default="Untitled document")
    content: str = ""
    format: str = Field(default="markdown", pattern="^(markdown|plain)$")


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    format: str | None = Field(default=None, pattern="^(markdown|plain)$")


class DocumentRead(BaseModel):
    id: int
    title: str
    content: str
    format: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}