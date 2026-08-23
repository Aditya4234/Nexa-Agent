"""Per-user LLM provider configuration stored in user preferences."""

from dataclasses import dataclass, field

from app.models.user import User

LLM_DEFAULTS: dict = {
    "provider": "openai",
    "api_key": "",
    "base_url": "",
    "model": "",
    "embedding_model": "",
}


def get_llm_config(user: User) -> dict:
    prefs = user.preferences or {}
    cfg = dict(LLM_DEFAULTS)
    cfg.update(prefs.get("llm", {}) or {})
    return cfg


def set_llm_config(user: User, cfg: dict) -> None:
    prefs = dict(user.preferences or {})
    merged = dict(LLM_DEFAULTS)
    merged.update(cfg or {})
    prefs["llm"] = merged
    user.preferences = prefs


def mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return f"{key[:4]}…{key[-4:]}"


@dataclass
class RuntimeLLMConfig:
    """Resolved provider configuration for a single LLM call."""

    provider: str = "openai"
    api_key: str = ""
    base_url: str = ""
    model: str = ""
    embedding_model: str = ""
    temperature: float = 0.7
    max_tokens: int = 2048
    extra: dict = field(default_factory=dict)

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    @property
    def resolved_model(self) -> str:
        if self.model:
            return self.model
        from app.core.config import settings

        return settings.DEFAULT_MODEL

    @property
    def resolved_embedding_model(self) -> str:
        if self.embedding_model:
            return self.embedding_model
        from app.core.config import settings

        return settings.EMBEDDING_MODEL


def resolve_config(user: User, model: str = "") -> RuntimeLLMConfig:
    """Merge per-user config over global settings to build an effective runtime config."""
    from app.core.config import settings

    cfg = get_llm_config(user)
    provider = cfg.get("provider", "openai")
    api_key = (cfg.get("api_key") or "").strip()
    if not api_key:
        api_key = settings.OPENAI_API_KEY if provider != "anthropic" else settings.ANTHROPIC_API_KEY

    model_val = (cfg.get("model") or "").strip()
    base_url = (cfg.get("base_url") or "").strip()

    if not model_val:
        if provider == "anthropic":
            model_val = settings.ANTHROPIC_MODEL
        else:
            model_val = settings.OPENAI_MODEL
    if not model_val and model and model != "default":
        model_val = model
    if not model_val:
        model_val = settings.DEFAULT_MODEL

    if not base_url:
        base_url = settings.OPENAI_BASE_URL

    return RuntimeLLMConfig(
        provider=provider,
        api_key=api_key,
        base_url=base_url,
        model=model_val,
        embedding_model=(cfg.get("embedding_model") or "").strip(),
        temperature=0.7,
        max_tokens=2048,
    )