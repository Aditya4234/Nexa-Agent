from fastapi import APIRouter, Depends
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.agent import Agent
from app.models.conversation import Conversation
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


async def _enrich(db: AsyncSession, project: Project) -> ProjectRead:
    agents = (await db.execute(select(func.count()).select_from(Agent).where(Agent.project_id == project.id))).scalar_one()
    convs = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.project_id == project.id))).scalar_one()
    read = ProjectRead.model_validate(project)
    read.agent_count = agents
    read.conversation_count = convs
    return read


@router.get("", response_model=list[ProjectRead])
async def list_projects(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[ProjectRead]:
    result = await db.execute(select(Project).where(Project.user_id == user.id).order_by(Project.created_at.desc()))
    return [await _enrich(db, p) for p in result.scalars().all()]


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(body: ProjectCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> ProjectRead:
    project = Project(user_id=user.id, **body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return await _enrich(db, project)


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: int, body: ProjectUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> ProjectRead:
    project = await db.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise NotFoundError("Project not found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return await _enrich(db, project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    project = await db.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise NotFoundError("Project not found.")
    # Detach resources before deleting.
    await db.execute(update(Agent).where(Agent.project_id == project_id).values(project_id=None))
    await db.execute(update(Conversation).where(Conversation.project_id == project_id).values(project_id=None))
    await db.delete(project)
    await db.commit()