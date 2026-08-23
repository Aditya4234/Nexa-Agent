from collections.abc import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    from app import models  # noqa: F401 - ensure models are imported

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Lightweight SQLite migration: add columns that newer models introduce.
    if "sqlite" in settings.DATABASE_URL:
        await _ensure_column("agents", "max_tokens", "INTEGER DEFAULT 2048")
        await _ensure_column("agents", "fallback_model", "VARCHAR(64) DEFAULT ''")
        await _ensure_column("agents", "project_id", "INTEGER")
        await _ensure_column("conversations", "project_id", "INTEGER")


async def _ensure_column(table: str, column: str, ddl: str) -> None:
    async with engine.begin() as conn:
        rows = await conn.execute(text(f"PRAGMA table_info({table})"))
        cols = {r[1] for r in rows}
        if column not in cols:
            await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))