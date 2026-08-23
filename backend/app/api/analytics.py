from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db import get_db
from app.models.agent import AgentRun, ToolExecution
from app.models.feedback import MessageFeedback
from app.models.user import User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("")
async def analytics(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    from datetime import date, timedelta

    today = date.today()

    def bucket(col):
        return func.date(col)

    # Daily series over the last 14 days.
    daily = []
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        runs = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id, func.date(AgentRun.created_at) == day))).scalar_one()
        tokens = (await db.execute(select(func.coalesce(func.sum(AgentRun.tokens), 0)).where(AgentRun.user_id == user.id, func.date(AgentRun.created_at) == day))).scalar_one()
        completed = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id, func.date(AgentRun.created_at) == day, AgentRun.status == "completed"))).scalar_one()
        failed = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id, func.date(AgentRun.created_at) == day, AgentRun.status == "failed"))).scalar_one()
        daily.append({"date": day.isoformat(), "runs": runs, "tokens": tokens, "completed": completed, "failed": failed})

    # Averages
    runs_total = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id))).scalar_one()
    runs_completed = (await db.execute(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id, AgentRun.status == "completed"))).scalar_one()
    avg_latency = (await db.execute(select(func.coalesce(func.avg(AgentRun.duration_ms), 0)).where(AgentRun.user_id == user.id, AgentRun.status == "completed"))).scalar_one()
    avg_tokens = (await db.execute(select(func.coalesce(func.avg(AgentRun.tokens), 0)).where(AgentRun.user_id == user.id))).scalar_one()
    total_tokens = (await db.execute(select(func.coalesce(func.sum(AgentRun.tokens), 0)).where(AgentRun.user_id == user.id))).scalar_one()
    total_cost = (await db.execute(select(func.coalesce(func.sum(AgentRun.cost), 0.0)).where(AgentRun.user_id == user.id))).scalar_one()
    tool_calls = (await db.execute(select(func.count()).select_from(ToolExecution).join(AgentRun).where(AgentRun.user_id == user.id))).scalar_one()
    up = (await db.execute(select(func.count()).select_from(MessageFeedback).where(MessageFeedback.user_id == user.id, MessageFeedback.feedback == "up"))).scalar_one()
    down = (await db.execute(select(func.count()).select_from(MessageFeedback).where(MessageFeedback.user_id == user.id, MessageFeedback.feedback == "down"))).scalar_one()

    # Tool usage breakdown
    tool_rows = (
        await db.execute(
            select(ToolExecution.tool_id, func.count(ToolExecution.id))
            .join(AgentRun)
            .where(AgentRun.user_id == user.id)
            .group_by(ToolExecution.tool_id)
            .order_by(func.count(ToolExecution.id).desc())
            .limit(10)
        )
    ).all()
    tool_usage = [{"tool_id": r[0], "count": r[1]} for r in tool_rows]

    # Model distribution
    model_rows = (
        await db.execute(select(AgentRun.model, func.count(AgentRun.id)).where(AgentRun.user_id == user.id).group_by(AgentRun.model).order_by(func.count(AgentRun.id).desc()).limit(8))
    ).all()
    model_distribution = [{"model": r[0] or "default", "count": r[1]} for r in model_rows]

    # Status distribution
    status_rows = (
        await db.execute(select(AgentRun.status, func.count(AgentRun.id)).where(AgentRun.user_id == user.id).group_by(AgentRun.status))
    ).all()
    status_distribution = [{"status": r[0], "count": r[1]} for r in status_rows]

    return {
        "daily": daily,
        "total_runs": runs_total,
        "completed_runs": runs_completed,
        "success_rate": round((runs_completed / runs_total * 100) if runs_total else 0.0, 1),
        "avg_latency_ms": round(float(avg_latency), 1),
        "avg_tokens_per_run": round(float(avg_tokens), 1),
        "total_tokens": total_tokens,
        "total_cost": round(float(total_cost), 4),
        "tool_calls": tool_calls,
        "feedback": {"up": up, "down": down},
        "tool_usage": tool_usage,
        "model_distribution": model_distribution,
        "status_distribution": status_distribution,
    }