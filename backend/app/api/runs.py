from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.agent import AgentRun
from app.models.user import User
from app.schemas.agent import AgentRunRead
from app.tools.registry import registry

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=list[AgentRunRead])
async def list_runs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[AgentRun]:
    result = await db.execute(select(AgentRun).where(AgentRun.user_id == user.id).order_by(AgentRun.created_at.desc()).limit(50))
    return list(result.scalars().all())


@router.get("/{run_id}", response_model=AgentRunRead)
async def get_run(run_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> AgentRun:
    run = await db.get(AgentRun, run_id)
    if not run or run.user_id != user.id:
        raise NotFoundError("Run not found.")
    return run


@router.get("/meta/tools")
async def tool_library() -> list[dict]:
    return registry.list()