import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.db import get_db
from app.models.approval import ApprovalRequest
from app.models.user import User
from app.schemas.approval import ApprovalDecide, ApprovalRead

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


def _to_read(a: ApprovalRequest) -> ApprovalRead:
    return ApprovalRead(
        id=a.id,
        run_id=a.run_id,
        tool_id=a.tool_id,
        args=json.loads(a.args or "{}"),
        reason=a.reason,
        status=a.status,
        created_at=a.created_at,
    )


@router.get("", response_model=list[ApprovalRead])
async def list_approvals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[ApprovalRead]:
    result = await db.execute(select(ApprovalRequest).where(ApprovalRequest.user_id == user.id).order_by(ApprovalRequest.created_at.desc()).limit(50))
    return [_to_read(a) for a in result.scalars().all()]


@router.get("/pending", response_model=list[ApprovalRead])
async def list_pending(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[ApprovalRead]:
    result = await db.execute(select(ApprovalRequest).where(ApprovalRequest.user_id == user.id, ApprovalRequest.status == "pending").order_by(ApprovalRequest.created_at.desc()))
    return [_to_read(a) for a in result.scalars().all()]


@router.post("/{approval_id}/decide", response_model=ApprovalRead)
async def decide(approval_id: int, body: ApprovalDecide, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> ApprovalRead:
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval or approval.user_id != user.id:
        raise NotFoundError("Approval request not found.")
    if approval.status != "pending":
        raise ConflictError(f"This request is already '{approval.status}'.")
    approval.status = "approved" if body.decision == "approve" else "rejected"
    approval.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(approval)
    return _to_read(approval)