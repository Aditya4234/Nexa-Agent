from datetime import datetime

from pydantic import BaseModel, Field


class ApprovalRead(BaseModel):
    id: int
    run_id: str
    tool_id: str
    args: dict
    reason: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovalDecide(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")