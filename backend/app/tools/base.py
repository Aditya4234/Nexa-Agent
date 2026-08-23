from dataclasses import dataclass, field
from typing import Any

from app.core.exceptions import ToolError


@dataclass
class ToolResult:
    ok: bool
    output: Any = None
    error: str | None = None
    duration_ms: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseTool:
    """Common interface for all tools."""

    id: str = "base"
    name: str = "Base Tool"
    description: str = ""
    input_schema: dict[str, Any] = {}
    output_schema: dict[str, Any] = {}
    timeout: int = 30
    requires_approval: bool = False

    async def validate_input(self, args: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(args, dict):
            raise ToolError(f"{self.id}: input must be a JSON object.")
        return args

    async def execute(self, args: dict[str, Any]) -> ToolResult:
        raise NotImplementedError

    async def validate_output(self, result: ToolResult) -> ToolResult:
        return result

    async def log_execution(self, run_id: str, args: dict[str, Any], result: ToolResult) -> None:
        from app.db import AsyncSessionLocal
        from app.models.agent import ToolExecution

        async with AsyncSessionLocal() as db:
            db.add(
                ToolExecution(
                    run_id=run_id,
                    tool_id=self.id,
                    input=args,
                    output={"ok": result.ok, "output": result.output, "error": result.error},
                    status="completed" if result.ok else "failed",
                    error=result.error,
                    duration_ms=result.duration_ms,
                )
            )
            await db.commit()

    async def run(self, run_id: str, args: dict[str, Any]) -> ToolResult:
        import time

        args = await self.validate_input(args)
        started = time.monotonic()
        try:
            result = await self.execute(args)
        except ToolError as exc:
            result = ToolResult(ok=False, error=str(exc))
        except Exception as exc:  # noqa: BLE001
            result = ToolResult(ok=False, error=f"{self.id} raised {type(exc).__name__}: {exc}")
        result.duration_ms = int((time.monotonic() - started) * 1000)
        result = await self.validate_output(result)
        if run_id:
            await self.log_execution(run_id, args, result)
        return result