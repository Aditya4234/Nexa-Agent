import uuid
from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import make_trace_id


class APIError(Exception):
    def __init__(
        self,
        message: str,
        type: str = "internal_error",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        retryable: bool = False,
        task_id: str | None = None,
        agent_id: str | None = None,
    ) -> None:
        self.message = message
        self.type = type
        self.status_code = status_code
        self.retryable = retryable
        self.task_id = task_id
        self.agent_id = agent_id
        self.error_id = uuid.uuid4().hex[:12]
        super().__init__(message)


def error_payload(exc: APIError) -> dict[str, Any]:
    return {
        "error": {
            "error_id": exc.error_id,
            "type": exc.type,
            "message": exc.message,
            "status_code": exc.status_code,
            "retryable": exc.retryable,
            "task_id": exc.task_id,
            "agent_id": exc.agent_id,
        }
    }


class ErrorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("x-trace-id", make_trace_id())
        request.state.trace_id = trace_id
        try:
            response = await call_next(request)
            response.headers["x-trace-id"] = trace_id
            return response
        except APIError as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content=error_payload(exc),
                headers={"x-trace-id": trace_id},
            )
        except Exception as exc:  # noqa: BLE001 - last-resort handler
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "error_id": uuid.uuid4().hex[:12],
                        "type": "internal_error",
                        "message": "An unexpected error occurred.",
                        "status_code": 500,
                        "retryable": True,
                        "task_id": None,
                        "agent_id": None,
                    }
                },
                headers={"x-trace-id": trace_id},
            )


class RateLimitError(APIError):
    def __init__(self, message: str = "Rate limit exceeded.") -> None:
        super().__init__(message, type="rate_limit", status_code=429, retryable=True)


class AuthError(APIError):
    def __init__(self, message: str = "Not authenticated.") -> None:
        super().__init__(message, type="auth_error", status_code=401)


class ForbiddenError(APIError):
    def __init__(self, message: str = "Forbidden.") -> None:
        super().__init__(message, type="forbidden", status_code=403)


class ValidationFailed(APIError):
    def __init__(self, message: str = "Validation failed.") -> None:
        super().__init__(message, type="validation_error", status_code=422)


class NotFoundError(APIError):
    def __init__(self, message: str = "Not found.") -> None:
        super().__init__(message, type="not_found", status_code=404)


class ConflictError(APIError):
    def __init__(self, message: str = "Conflict.") -> None:
        super().__init__(message, type="conflict", status_code=409)


class LLMError(APIError):
    def __init__(self, message: str = "LLM request failed.") -> None:
        super().__init__(message, type="llm_error", status_code=502, retryable=True)


class ToolError(APIError):
    def __init__(self, message: str = "Tool execution failed.", retryable: bool = False) -> None:
        super().__init__(message, type="tool_error", status_code=502, retryable=retryable)