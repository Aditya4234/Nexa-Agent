from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    project_id: int | None = None
    system_prompt: str = ""
    model: str = "default"
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=64, le=128000)
    tools: list[str] = Field(default_factory=list)
    memory_enabled: bool = True
    max_steps: int = Field(default=10, ge=1, le=50)
    timeout: int = Field(default=120, ge=10, le=3600)
    fallback_model: str = ""
    icon: str = "🤖"


class AgentRead(BaseModel):
    id: int
    name: str
    description: str
    project_id: int | None
    system_prompt: str
    model: str
    temperature: float
    max_tokens: int
    tools: list[str]
    memory_enabled: bool
    max_steps: int
    timeout: int
    fallback_model: str
    is_system: bool
    icon: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    project_id: int | None = None
    system_prompt: str | None = None
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    tools: list[str] | None = None
    memory_enabled: bool | None = None
    max_steps: int | None = None
    fallback_model: str | None = None
    icon: str | None = None


class ToolCallRead(BaseModel):
    tool_id: str
    status: str
    duration_ms: int
    error: str | None = None

    model_config = {"from_attributes": True}


class AgentRunRead(BaseModel):
    id: str
    agent_id: int | None
    status: str
    input: str
    result: str
    error: str | None
    model: str
    tokens: int
    cost: float
    duration_ms: int
    steps: list[Any]
    tools_used: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}