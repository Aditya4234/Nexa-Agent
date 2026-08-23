from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db import get_db
from app.models.agent import Agent, AgentRun, ToolExecution
from app.models.conversation import Conversation, Message
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def dashboard_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    agents = (await db.execute(select(func.count()).select_from(Agent).where(Agent.user_id == user.id))).scalar_one()
    conversations = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.user_id == user.id))).scalar_one()
    runs_total = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id))).scalar_one()
    runs_running = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id, AgentRun.status == "running"))).scalar_one()
    runs_completed = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id, AgentRun.status == "completed"))).scalar_one()
    tools_total = (await db.execute(select(func.count()).select_from(ToolExecution).join(AgentRun).where(AgentRun.user_id == user.id))).scalar_one()
    tokens = (await db.execute(select(func.coalesce(func.sum(AgentRun.tokens), 0)).where(AgentRun.user_id == user.id))).scalar_one()
    cost = (await db.execute(select(func.coalesce(func.sum(AgentRun.cost), 0.0)).where(AgentRun.user_id == user.id))).scalar_one()
    success_rate = round((runs_completed / runs_total * 100) if runs_total else 0.0, 1)

    recent = list(
        (
            await db.execute(
                select(AgentRun)
                .where(AgentRun.user_id == user.id)
                .order_by(AgentRun.created_at.desc())
                .limit(8)
            )
        ).scalars().all()
    )

    # activity: last 7 days
    from datetime import date, timedelta

    today = date.today()
    activity = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = (await db.execute(select(func.count()).select_from(Message).where(func.date(Message.created_at) == day))).scalar_one()
        activity.append({"date": day.isoformat(), "messages": count})

    return {
        "active_agents": agents,
        "conversations": conversations,
        "total_executions": runs_total,
        "running_tasks": runs_running,
        "completed_tasks": runs_completed,
        "success_rate": success_rate,
        "token_usage": tokens,
        "estimated_cost": round(float(cost), 4),
        "tool_calls": tools_total,
        "recent_runs": [
            {
                "id": r.id,
                "status": r.status,
                "model": r.model,
                "created_at": r.created_at.isoformat(),
                "tokens": r.tokens,
                "cost": r.cost,
                "input": r.input[:80],
                "agent_id": r.agent_id,
            }
            for r in recent
        ],
        "activity": activity,
    }