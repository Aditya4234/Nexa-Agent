import time

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db import get_db
from app.models.user import User
from app.schemas.settings import LLMConfigPayload, LLMConfigRead, LLMTestRequest, LLMTestResult
from app.services.llm import LLMService
from app.services.llm_config import get_llm_config, mask_key, resolve_config, set_llm_config

router = APIRouter(prefix="/api/settings", tags=["settings"])

_PROVIDERS = {"openai": "openai", "openai_compatible": "openai", "anthropic": "anthropic"}


@router.get("/llm", response_model=LLMConfigRead)
async def read_llm_config(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> LLMConfigRead:
    cfg = get_llm_config(user)
    api_key = (cfg.get("api_key") or "").strip()
    provider = cfg.get("provider", "openai")

    if api_key:
        source, configured, active_global = "user", True, False
    elif settings.llm_available:
        source, configured, active_global = "global", True, True
        api_key = settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY
    else:
        source, configured, active_global = "none", False, False

    model = (cfg.get("model") or "").strip()
    base_url = (cfg.get("base_url") or "").strip()
    embedding_model = (cfg.get("embedding_model") or "").strip()

    if source == "global":
        model = settings.OPENAI_MODEL if settings.OPENAI_API_KEY else settings.ANTHROPIC_MODEL
        base_url = settings.OPENAI_BASE_URL
        embedding_model = settings.EMBEDDING_MODEL
    if not model:
        model = settings.DEFAULT_MODEL

    return LLMConfigRead(
        provider=provider,
        model=model,
        base_url=base_url,
        embedding_model=embedding_model,
        api_key_masked=mask_key(api_key),
        configured=configured,
        source=source,
        active_global=active_global,
    )


@router.put("/llm", response_model=LLMConfigRead)
async def update_llm_config(
    body: LLMConfigPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LLMConfigRead:
    existing = get_llm_config(user)
    api_key = (body.api_key or "").strip()
    # Preserve the existing key if the user submits an empty/masked value. "CLEAR" removes it.
    if api_key == "CLEAR":
        api_key = ""
    elif not api_key or "…" in api_key:
        api_key = (existing.get("api_key") or "").strip()

    new_cfg = {
        "provider": body.provider,
        "api_key": api_key,
        "base_url": (body.base_url or "").strip(),
        "model": (body.model or "").strip(),
        "embedding_model": (body.embedding_model or "").strip(),
    }
    set_llm_config(user, new_cfg)
    await db.commit()

    provider = new_cfg["provider"]
    if new_cfg["api_key"]:
        source, configured = "user", True
    elif settings.llm_available:
        source, configured = "global", True
    else:
        source, configured = "none", False

    return LLMConfigRead(
        provider=provider,
        model=new_cfg["model"] or settings.DEFAULT_MODEL,
        base_url=new_cfg["base_url"],
        embedding_model=new_cfg["embedding_model"],
        api_key_masked=mask_key(new_cfg["api_key"]),
        configured=configured,
        source=source,
        active_global=not new_cfg["api_key"] and settings.llm_available,
    )


@router.post("/llm/test", response_model=LLMTestResult)
async def test_llm_config(
    body: LLMTestRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LLMTestResult:
    saved = get_llm_config(user)
    api_key = (body.api_key or "").strip()
    if not api_key or "…" in api_key:
        api_key = (saved.get("api_key") or "").strip()
    if not api_key:
        api_key = settings.OPENAI_API_KEY if body.provider != "anthropic" else settings.ANTHROPIC_API_KEY

    if not api_key:
        return LLMTestResult(ok=False, message="No API key configured. Add one in Settings → LLM Provider.", latency_ms=None)

    cfg = resolve_config(user, body.model)
    cfg.provider = _PROVIDERS.get(body.provider, "openai")
    cfg.api_key = api_key
    cfg.base_url = (body.base_url or "").strip() or cfg.base_url
    if (body.model or "").strip():
        cfg.model = body.model.strip()

    service = LLMService()
    started = time.monotonic()
    try:
        await service.complete(
            [{"role": "user", "content": "Reply with exactly: OK"}],
            config=cfg,
            temperature=0,
            max_tokens=8,
        )
        latency_ms = int((time.monotonic() - started) * 1000)
        return LLMTestResult(ok=True, message=f"Connected via {cfg.provider} ({cfg.resolved_model}).", latency_ms=latency_ms)
    except Exception as exc:  # noqa: BLE001
        latency_ms = int((time.monotonic() - started) * 1000)
        return LLMTestResult(ok=False, message=str(exc), latency_ms=latency_ms)