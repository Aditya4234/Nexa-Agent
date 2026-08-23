from datetime import datetime

from pydantic import BaseModel, Field


class EvaluationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    agent_id: int | None = None
    model: str = "default"
    cases: list[dict] = Field(default_factory=list)  # [{input, expected}]


class EvaluationRead(BaseModel):
    id: int
    name: str
    description: str
    agent_id: int | None
    model: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EvalRunRead(BaseModel):
    id: int
    evaluation_id: int
    status: str
    passed: int
    failed: int
    total: int
    results: str | list = "[]"  # JSON string or parsed list of case results
    created_at: datetime

    model_config = {"from_attributes": True}