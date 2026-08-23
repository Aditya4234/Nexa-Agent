from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.db import get_db
from app.models.user import User
from app.schemas.knowledge import KnowledgeDocRead, KnowledgeSearchRequest, KnowledgeSearchResponse, KnowledgeSearchResult
from app.services.knowledge import KnowledgeService
from app.services.llm_config import resolve_config

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES = {"txt", "md", "markdown", "pdf", "json", "csv"}


@router.get("", response_model=list[KnowledgeDocRead])
async def list_knowledge(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list:
    return await KnowledgeService(db).list_docs(user.id)


@router.post("/upload", response_model=KnowledgeDocRead, status_code=201)
async def upload_knowledge(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filename = file.filename or "upload"
    if "." not in filename:
        raise ConflictError("Unsupported file type.")
    ext = filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_TYPES:
        raise ConflictError(f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(ALLOWED_TYPES))}")

    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise ConflictError("File too large. Maximum size is 10 MB.")
    if len(data) == 0:
        raise ConflictError("Empty file.")

    service = KnowledgeService(db)
    doc = await service.create_from_bytes(user.id, filename, data, llm_config=resolve_config(user))
    if doc.status == "failed":
        raise ConflictError(f"Indexing failed: {doc.error}")
    KnowledgeService.store_file(user.id, doc.id, data)
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_knowledge(document_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    deleted = await KnowledgeService(db).delete_doc(user.id, document_id)
    if not deleted:
        raise NotFoundError("Knowledge document not found.")


@router.post("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(
    body: KnowledgeSearchRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeSearchResponse:
    if not body.query.strip():
        raise ConflictError("Query cannot be empty.")
    payload = await KnowledgeService(db).search(user.id, body.query, k=body.k, llm_config=resolve_config(user))
    return KnowledgeSearchResponse(
        query=body.query,
        results=[KnowledgeSearchResult(**r) for r in payload["results"]],
        mode=payload["mode"],
    )