from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.db import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentRead, DocumentUpdate

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[DocumentRead])
async def list_documents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Document]:
    result = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(Document.updated_at.desc()).limit(200)
    )
    return list(result.scalars().all())


@router.post("", response_model=DocumentRead, status_code=201)
async def create_document(body: DocumentCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Document:
    doc = Document(user_id=user.id, **body.model_dump())
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(document_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Document:
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != user.id:
        raise NotFoundError("Document not found.")
    return doc


@router.put("/{document_id}", response_model=DocumentRead)
async def update_document(
    document_id: int,
    body: DocumentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != user.id:
        raise NotFoundError("Document not found.")
    updates = body.model_dump(exclude_unset=True)
    if "title" in updates and not updates["title"]:
        raise ConflictError("Title cannot be empty.")
    for field, value in updates.items():
        setattr(doc, field, value)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != user.id:
        raise NotFoundError("Document not found.")
    await db.delete(doc)
    await db.commit()