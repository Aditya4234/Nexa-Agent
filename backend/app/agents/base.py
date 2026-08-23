from dataclasses import dataclass
from typing import Any

from app.services.llm import LLMService


@dataclass
class Step:
    name: str
    status: str = "running"  # running | completed | failed | skipped
    detail: str = ""
    started_ms: int = 0
    duration_ms: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name, "status": self.status, "detail": self.detail}


class BaseAgent:
    """Common interface every agent implements. Swap agents without touching orchestration."""

    id: str = "base"
    name: str = "Base Agent"
    description: str = ""
    icon: str = "🤖"
    system_prompt: str = "You are a helpful AI agent."
    default_tools: list[str] = []

    def __init__(self, llm: LLMService) -> None:
        self.llm = llm
        self.steps: list[Step] = []

    def add_step(self, name: str, status: str = "running", detail: str = "") -> Step:
        step = Step(name=name, status=status, detail=detail)
        self.steps.append(step)
        return step

    def build_messages(self, task: str, context: list[dict] | None = None) -> list[dict]:
        messages: list[dict] = [{"role": "system", "content": self.system_prompt}]
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": task})
        return messages

    async def run(self, task: str, context: list[dict] | None = None) -> str:
        raise NotImplementedError


class AgentEventEmitter:
    """Streams agent lifecycle events to the client."""

    def __init__(self, emit) -> None:
        self.emit = emit

    async def started(self, agent_id: str, agent_name: str) -> None:
        await self.emit("agent.started", {"agent_id": agent_id, "agent_name": agent_name})

    async def thinking(self, detail: str = "") -> None:
        await self.emit("agent.thinking", {"detail": detail})

    async def plan(self, steps: list[str]) -> None:
        await self.emit("plan.created", {"steps": steps})

    async def tool_started(self, tool_id: str, args: dict) -> None:
        await self.emit("tool.started", {"tool_id": tool_id, "args": args})

    async def tool_completed(self, tool_id: str, summary: str = "") -> None:
        await self.emit("tool.completed", {"tool_id": tool_id, "summary": summary})

    async def message(self, content: str) -> None:
        await self.emit("agent.message", {"content": content})

    async def approval(self, tool_id: str, reason: str) -> None:
        await self.emit("approval.required", {"tool_id": tool_id, "reason": reason})

    async def completed(self, result: str) -> None:
        await self.emit("agent.completed", {"result": result})

    async def error(self, message: str) -> None:
        await self.emit("agent.error", {"message": message})