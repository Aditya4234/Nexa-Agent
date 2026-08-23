import json
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db import get_db
from app.models.agent import AgentRun, ToolExecution
from app.models.feedback import MessageFeedback
from app.models.user import User

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("")
async def get_logs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    runs = list(
        (await db.execute(select(AgentRun).where(AgentRun.user_id == user.id).order_by(AgentRun.created_at.desc()).limit(50))).scalars().all()
    )

    entries = []
    for r in runs:
        entries.append(
            {
                "id": f"run-{r.id}",
                "level": "error" if r.status == "failed" else "info",
                "source": "agent_run",
                "message": f"Run {r.status}: {r.input[:80]}",
                "detail": r.error or r.result[:200] if r.result else "",
                "run_id": r.id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
        )

    tool_rows = (
        await db.execute(
            select(ToolExecution)
            .join(AgentRun)
            .where(AgentRun.user_id == user.id)
            .order_by(ToolExecution.created_at.desc())
            .limit(30)
        )
    ).scalars().all()
    for t in tool_rows:
        entries.append(
            {
                "id": f"tool-{t.id}",
                "level": "error" if t.status == "failed" else "info",
                "source": "tool",
                "message": f"Tool {t.tool_id} {t.status} in {t.duration_ms}ms",
                "detail": t.error or "",
                "run_id": t.run_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
        )

    feedback_rows = list((await db.execute(select(MessageFeedback).where(MessageFeedback.user_id == user.id).order_by(MessageFeedback.created_at.desc()).limit(20))).scalars().all())
    for f in feedback_rows:
        entries.append(
            {
                "id": f"fb-{f.id}",
                "level": "info",
                "source": "feedback",
                "message": f"User feedback: {f.feedback}",
                "detail": f.comment or "",
                "run_id": f.run_id or "",
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
        )

    entries.sort(key=lambda e: e["created_at"] or "", reverse=True)
    return {"total": len(entries), "entries": entries[:100]}