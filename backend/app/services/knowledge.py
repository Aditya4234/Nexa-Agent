"""Knowledge base service: file extraction, chunking, embeddings, and retrieval."""

import re
import uuid
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.knowledge import KnowledgeChunk, KnowledgeDoc
from app.services.llm import LLMService
from app.services.llm_config import RuntimeLLMConfig

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def extract_text(filename: str, data: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        from io import BytesIO

        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages)
    # txt / md / json / csv etc.
    try:
        return data.decode("utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        return data.decode("latin-1", errors="replace")


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text.strip())
    if not text:
        return []
    if len(text) <= size:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            nl = text.rfind("\n", start + size // 2, end)
            space = text.rfind(" ", start + size // 2, end)
            cut = max(nl, space)
            if cut > start + size // 2:
                end = cut
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks[:200]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _keyword_score(query_words: set[str], content: str) -> float:
    content_lower = content.lower()
    if not query_words:
        return 0.0
    hits = sum(1 for w in query_words if w in content_lower)
    return hits / len(query_words)


def _query_words(query: str) -> set[str]:
    words = re.findall(r"[a-z0-9]{3,}", query.lower())
    stop = {"the", "and", "for", "with", "what", "this", "that", "from", "how", "your", "you", "are", "can", "into", "using", "about"}
    return {w for w in words if w not in stop}


class KnowledgeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_from_bytes(
        self,
        user_id: int,
        filename: str,
        data: bytes,
        llm_config: RuntimeLLMConfig | None = None,
    ) -> KnowledgeDoc:
        doc = KnowledgeDoc(
            user_id=user_id,
            name=filename,
            file_type=_file_type(filename),
            size=len(data),
            status="processing",
        )
        self.db.add(doc)
        await self.db.flush()

        try:
            text = extract_text(filename, data)
            if not text.strip():
                raise ValueError("No readable text found in this file.")
            chunks = chunk_text(text)
            if not chunks:
                raise ValueError("File was empty after processing.")

            embeddings: list[list[float] | None] = []
            if llm_config and llm_config.available:
                try:
                    vectors = await LLMService().embed(chunks, config=llm_config)
                    embeddings = list(vectors) if vectors else [None] * len(chunks)
                except Exception:  # noqa: BLE001 - embedding failure degrades to keyword search
                    embeddings = [None] * len(chunks)
            else:
                embeddings = [None] * len(chunks)

            for i, (chunk, vec) in enumerate(zip(chunks, embeddings)):
                self.db.add(
                    KnowledgeChunk(
                        doc_id=doc.id,
                        chunk_index=i,
                        content=chunk,
                        embedding=vec,
                        tokens=max(1, len(chunk.split())),
                    )
                )

            doc.chunk_count = len(chunks)
            doc.status = "ready"
        except Exception as exc:  # noqa: BLE001
            doc.status = "failed"
            doc.error = str(exc)

        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def list_docs(self, user_id: int) -> list[KnowledgeDoc]:
        result = await self.db.execute(
            select(KnowledgeDoc).where(KnowledgeDoc.user_id == user_id).order_by(KnowledgeDoc.created_at.desc()).limit(100)
        )
        return list(result.scalars().all())

    async def delete_doc(self, user_id: int, doc_id: int) -> KnowledgeDoc | None:
        doc = await self.db.get(KnowledgeDoc, doc_id)
        if not doc or doc.user_id != user_id:
            return None
        file_ref = f"{settings.knowledge_dir}/{user_id}/{doc_id}"
        await self.db.delete(doc)
        await self.db.commit()
        try:
            Path(file_ref).unlink(missing_ok=True)
        except Exception:  # noqa: BLE001
            pass
        return doc

    async def search(
        self,
        user_id: int,
        query: str,
        k: int = 4,
        llm_config: RuntimeLLMConfig | None = None,
    ) -> list[dict]:
        """Retrieves the top-k chunks. Uses embeddings when available, else keyword scoring."""
        query = query.strip()
        if not query:
            return []

        chunk_rows = (
            await self.db.execute(
                text(
                    "SELECT k.id, k.doc_id, k.chunk_index, k.content, k.embedding, d.name AS doc_name "
                    "FROM knowledge_chunks k JOIN knowledge_docs d ON d.id = k.doc_id "
                    "WHERE d.user_id = :uid AND d.status = 'ready'"
                ),
                {"uid": user_id},
            )
        ).all()

        if not chunk_rows:
            return []

        # Prefer embedding search when any chunk has vectors.
        has_embeddings = any(r.embedding for r in chunk_rows)
        query_vector = None
        mode = "keyword"
        if has_embeddings and llm_config and llm_config.available:
            try:
                vectors = await LLMService().embed([query], config=llm_config)
                if vectors:
                    query_vector = vectors[0]
                    mode = "embedding"
            except Exception:  # noqa: BLE001
                query_vector = None

        scored = []
        words = _query_words(query)
        for row in chunk_rows:
            embedding = row.embedding or []
            if query_vector and embedding:
                score = cosine_similarity(query_vector, embedding)
            else:
                score = _keyword_score(words, row.content or "")
            if score > 0:
                scored.append((score, row))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = [
            {
                "content": (row.content or "")[:4000],
                "doc_name": row.doc_name,
                "chunk_index": row.chunk_index,
                "score": round(score, 4),
            }
            for score, row in scored[:k]
        ]
        return {"results": results, "mode": mode}

    @staticmethod
    def store_file(user_id: int, doc_id: int, data: bytes) -> None:
        base = Path(settings.knowledge_dir) / str(user_id)
        base.mkdir(parents=True, exist_ok=True)
        (base / str(doc_id)).write_bytes(data)


def _file_type(filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        return "pdf"
    if name.endswith(".md") or name.endswith(".markdown"):
        return "md"
    return "txt"