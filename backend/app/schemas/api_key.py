from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(default="Default key", max_length=255)


class ApiKeyRead(BaseModel):
    id: int
    name: str
    prefix: str
    revoked: bool
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyRead):
    key: str = ""  # full key shown once at creation