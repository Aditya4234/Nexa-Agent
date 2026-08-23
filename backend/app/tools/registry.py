from typing import Any, List

from app.tools.base import BaseTool
from app.tools.code_executor import CodeExecutorTool, FileReaderTool
from app.tools.email_tool import SendEmailTool
from app.tools.http_tool import HttpRequestTool
from app.tools.web_search import CalculatorTool, WebSearchTool


class ToolRegistry:
    """Central registry. Agents can only call registered tools (permission check in the registry)."""

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}
        self._permissions: dict[str, dict[str, bool]] = {}

    def register(self, tool: BaseTool) -> None:
        self._tools[tool.id] = tool

    def get(self, tool_id: str) -> BaseTool | None:
        return self._tools.get(tool_id)

    def list(self) -> list[dict[str, Any]]:
        return [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "input_schema": t.input_schema,
                "requires_approval": t.requires_approval,
            }
            for t in self._tools.values()
        ]

    def to_openai_schema(self, tool_ids: List[str]) -> List[dict[str, Any]]:
        """Builds OpenAI-compatible tool definitions for the LLM tool-calling loop."""
        tools: List[dict[str, Any]] = []
        for tool_id in tool_ids:
            tool = self._tools.get(tool_id)
            if not tool:
                continue
            properties: dict[str, Any] = {}
            for field, ftype in (tool.input_schema or {}).items():
                if "|" in str(ftype):
                    json_type = "string"
                elif "int" in str(ftype):
                    json_type = "integer"
                elif "float" in str(ftype):
                    json_type = "number"
                elif "bool" in str(ftype):
                    json_type = "boolean"
                else:
                    json_type = "string"
                properties[field] = {"type": json_type, "description": field.replace("_", " ")}
            tools.append(
                {
                    "type": "function",
                    "function": {
                        "name": tool.id,
                        "description": tool.description or tool.name,
                        "parameters": {"type": "object", "properties": properties, "required": list(properties.keys()) or None},
                    },
                }
            )
        return tools

    def set_permission(self, agent_id: int, tool_id: str, allowed: bool) -> None:
        self._permissions.setdefault(str(agent_id), {})[tool_id] = allowed

    def can_use(self, agent_id: str, tool_id: str) -> bool:
        perms = self._permissions.get(agent_id)
        if perms is None:
            return True
        return perms.get(tool_id, False)

    async def execute(self, tool_id: str, args: dict[str, Any], run_id: str = "", agent_id: str = "") -> Any:
        from app.core.exceptions import ForbiddenError, NotFoundError

        if tool_id not in self._tools:
            raise NotFoundError(f"Tool '{tool_id}' is not registered.")
        if agent_id and not self.can_use(agent_id, tool_id):
            raise ForbiddenError(f"Agent {agent_id} is not permitted to use tool '{tool_id}'.")
        tool = self._tools[tool_id]
        if tool.requires_approval:
            # Human-in-the-loop hook: escalate to approval service.
            from app.core.exceptions import ToolError

            raise ToolError(f"Tool '{tool_id}' requires human approval.", retryable=True)
        return await tool.run(run_id, args)


registry = ToolRegistry()
registry.register(WebSearchTool())
registry.register(CalculatorTool())
registry.register(CodeExecutorTool())
registry.register(FileReaderTool())
registry.register(HttpRequestTool())
registry.register(SendEmailTool())