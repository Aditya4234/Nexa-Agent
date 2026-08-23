from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    agents,
    analytics,
    api_keys,
    approvals,
    auth,
    chat,
    conversations,
    dashboard,
    documents,
    evaluations,
    feedback,
    knowledge,
    logs,
    notifications,
    plugins,
    projects,
    runs,
    sites,
    workflows,
)
from app.api import settings as settings_api
from app.core.config import settings
from app.core.exceptions import ErrorMiddleware
from app.core.logging import setup_logging
from app.db import init_db

setup_logging()

app = FastAPI(title=settings.APP_NAME, version="0.1.0", docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ErrorMiddleware)

for r in (
    auth.router,
    chat.router,
    conversations.router,
    agents.router,
    runs.router,
    dashboard.router,
    documents.router,
    plugins.router,
    settings_api.router,
    knowledge.router,
    api_keys.router,
    projects.router,
    sites.router,
    feedback.router,
    notifications.router,
    analytics.router,
    workflows.router,
    approvals.router,
    logs.router,
    evaluations.router,
):
    app.include_router(r)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV, "llm_configured": settings.llm_available}