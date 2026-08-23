from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.planner import system_agents
from app.models.agent import Agent


class AgentRegistry:
    """Resolves system agents and user agents by id/name."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._system = {a.id: a for a in system_agents()}

    @property
    def system(self) -> dict[str, Any]:
        return self._system

    async def list_user_agents(self, user_id: int) -> list[Agent]:
        result = await self.db.execute(select(Agent).where(Agent.user_id == user_id).order_by(Agent.created_at))
        return list(result.scalars().all())

    async def get(self, agent_id: int | None, user_id: int) -> Agent | None:
        if agent_id is None:
            return None
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id, Agent.user_id == user_id))
        return result.scalar_one_or_none()

    def system_prompt_for(self, agent: Agent | None, base: str = "") -> str:
        if agent and agent.system_prompt:
            return agent.system_prompt
        return base

    def tools_for(self, agent: Agent | None, explicit: list[str] | None = None) -> list[str]:
        if explicit:
            return explicit
        return (agent.tools if agent else []) or []