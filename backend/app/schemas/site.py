from datetime import datetime

from pydantic import BaseModel, Field


class SiteGenerate(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)
    name: str = Field(default="", max_length=255)


class SiteRevise(BaseModel):
    instruction: str = Field(min_length=2, max_length=2000)


class SiteUpdate(BaseModel):
    name: str | None = None
    html: str | None = None


class SiteRead(BaseModel):
    id: int
    name: str
    prompt: str
    html: str
    share_id: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SiteSummary(BaseModel):
    id: int
    name: str
    prompt: str
    share_id: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
