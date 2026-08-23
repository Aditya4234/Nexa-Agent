from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "AgentX AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexa.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    QDRANT_URL: str = "http://localhost:6333"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-5"

    DEFAULT_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    MAX_STEPS: int = 10
    AGENT_TIMEOUT: int = 120
    CODE_EXEC_TIMEOUT: int = 30
    DATA_DIR: str = "data"

    # Rate limiting (per-user, sliding window)
    RATE_LIMIT_REQUESTS: int = 30
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Approvals
    APPROVAL_TIMEOUT_SECONDS: int = 90
    APPROVAL_POLL_INTERVAL: float = 0.5

    @property
    def llm_available(self) -> bool:
        return bool(self.OPENAI_API_KEY or self.ANTHROPIC_API_KEY)

    @property
    def knowledge_dir(self) -> str:
        from pathlib import Path

        path = Path(self.DATA_DIR) / "knowledge"
        path.mkdir(parents=True, exist_ok=True)
        return str(path)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()