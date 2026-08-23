from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user
from app.core.exceptions import RateLimitError
from app.core.config import settings
from app.db import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest
from app.services.chat_runner import ChatRunner
from app.services.rate_limit import rate_limiter
from app.services.streaming import sse_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(body: ChatRequest, user: User = Depends(get_current_user), db=Depends(get_db)) -> StreamingResponse:
    if settings.RATE_LIMIT_REQUESTS > 0:
        limit = rate_limiter.is_allowed(str(user.id), limit=settings.RATE_LIMIT_REQUESTS, window=settings.RATE_LIMIT_WINDOW_SECONDS)
        if not limit.allowed:
            raise RateLimitError(f"Rate limit exceeded. Try again in {limit.retry_after}s.")
    runner = ChatRunner(db, user.id)
    return sse_response(runner.run(body))