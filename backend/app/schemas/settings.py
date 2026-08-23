from pydantic import BaseModel, Field


class LLMConfigPayload(BaseModel):
    provider: str = Field(default="openai", pattern="^(openai|anthropic|openai_compatible)$")
    api_key: str = ""
    base_url: str = ""
    model: str = ""
    embedding_model: str = ""


class LLMConfigRead(BaseModel):
    provider: str
    model: str
    base_url: str
    embedding_model: str
    api_key_masked: str
    configured: bool
    source: str  # user | global | none
    active_global: bool


class LLMTestRequest(BaseModel):
    provider: str = "openai"
    api_key: str = ""
    base_url: str = ""
    model: str = ""


class LLMTestResult(BaseModel):
    ok: bool
    message: str
    latency_ms: int | None = None