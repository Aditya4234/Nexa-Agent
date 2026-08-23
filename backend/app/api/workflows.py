from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.db import get_db
from app.models.user import User
from app.services.llm_config import resolve_config
from app.services.workflow import WorkflowService

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.post("/run")
async def run_workflow(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    goal = str(body.get("goal", "")).strip()
    agent_id = body.get("agent_id")
    if not goal:
        raise ConflictError("A 'goal' is required.")
    service = WorkflowService(db, user.id)
    return await service.run(goal, resolve_config(user), agent_id=agent_id)