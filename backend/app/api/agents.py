from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import AgentRegistry
from app.api.deps import get_current_user
from app.db import get_db
from app.models.agent import Agent
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentRead, AgentUpdate

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentRead])
async def list_agents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Agent]:
    registry = AgentRegistry(db)
    user_agents = await registry.list_user_agents(user.id)
    return user_agents


@router.post("", response_model=AgentRead, status_code=201)
async def create_agent(body: AgentCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Agent:
    agent = Agent(user_id=user.id, **body.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.put("/{agent_id}", response_model=AgentRead)
async def update_agent(agent_id: int, body: AgentUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Agent:
    from app.core.exceptions import NotFoundError

    agent = await db.get(Agent, agent_id)
    if not agent or agent.user_id != user.id:
        raise NotFoundError("Agent not found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    from app.core.exceptions import NotFoundError

    agent = await db.get(Agent, agent_id)
    if not agent or agent.user_id != user.id:
        raise NotFoundError("Agent not found.")
    await db.delete(agent)
    await db.commit()


@router.get("/templates")
async def agent_templates() -> list[dict]:
    from app.agents.planner import system_agents

    return [
        {"id": a.id, "name": a.name, "description": a.description, "icon": a.icon, "tools": a.default_tools, "system_prompt": a.system_prompt}
        for a in system_agents()
    ]