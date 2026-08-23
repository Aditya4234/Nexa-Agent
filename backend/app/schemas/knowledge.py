from datetime import datetime

from pydantic import BaseModel


class KnowledgeDocRead(BaseModel):
    id: int
    name: str
    file_type: str
    size: int
    chunk_count: int
    status: str
    error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeSearchRequest(BaseModel):
    query: str
    k: int = 4


class KnowledgeSearchResult(BaseModel):
    content: str
    doc_name: str
    chunk_index: int
    score: float


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: list[KnowledgeSearchResult]
    mode: str  # embedding | keyword | none