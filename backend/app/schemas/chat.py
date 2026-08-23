from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20000)
    conversation_id: int | None = None
    agent_id: int | None = None
    model: str = "default"
    tools: list[str] = Field(default_factory=list)
    plugins: list[str] = Field(default_factory=list)
    stream: bool = True


class SSEEvent(BaseModel):
    event: str
    data: dict[str, Any]