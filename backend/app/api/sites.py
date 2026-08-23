import uuid

from fastapi import APIRouter, Depends, Response
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.site import GeneratedSite
from app.models.user import User
from app.schemas.site import SiteGenerate, SiteRead, SiteRevise, SiteSummary, SiteUpdate
from app.services.llm_config import resolve_config
from app.services.site_builder import extract_html, stream_generation, stream_revision
from app.services.streaming import sse_format, sse_response

router = APIRouter(tags=["sites"])


def _model_name(user: User) -> str:
    cfg = resolve_config(user)
    return cfg.resolved_model if cfg.available else "mock"


async def _get_site(db: AsyncSession, site_id: int, user: User) -> GeneratedSite:
    site = await db.get(GeneratedSite, site_id)
    if not site or site.user_id != user.id:
        raise NotFoundError("Site not found.")
    return site


@router.post("/api/sites/generate")
async def generate_site(body: SiteGenerate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Stream-generate a complete website from a prompt (SSE)."""

    async def run():
        yield sse_format("status", {"stage": "planning", "message": "Understanding your request…"})
        model = _model_name(user)
        yield sse_format("status", {"stage": "writing", "message": "Designing and writing code…", "model": model})
        raw = ""
        try:
            async for chunk in stream_generation(user, body.prompt):
                raw += chunk
                yield sse_format("delta", {"text": chunk})
        except Exception as exc:  # noqa: BLE001
            yield sse_format("error", {"message": f"Generation failed: {exc}"})
            return
        html = extract_html(raw)
        if "<html" not in html.lower():
            yield sse_format("error", {"message": "The model did not return a valid website. Try again."})
            return
        yield sse_format("status", {"stage": "saving", "message": "Publishing your site…"})
        name = body.name.strip() or (body.prompt.strip()[:60] + ("…" if len(body.prompt.strip()) > 60 else ""))
        site = GeneratedSite(
            user_id=user.id,
            name=name,
            prompt=body.prompt,
            html=html,
            share_id=uuid.uuid4().hex[:12],
            model=model,
        )
        db.add(site)
        await db.commit()
        await db.refresh(site)
        yield sse_format("done", {"site": SiteRead.model_validate(site).model_dump(mode="json")})

    return sse_response(run())


@router.post("/api/sites/{site_id}/revise")
async def revise_site(site_id: int, body: SiteRevise, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Apply a follow-up instruction to an existing site (SSE)."""
    site = await _get_site(db, site_id, user)

    async def run():
        yield sse_format("status", {"stage": "planning", "message": "Planning your changes…"})
        yield sse_format("status", {"stage": "writing", "message": "Applying changes…", "model": _model_name(user)})
        raw = ""
        try:
            async for chunk in stream_revision(user, site.html, body.instruction):
                raw += chunk
                yield sse_format("delta", {"text": chunk})
        except Exception as exc:  # noqa: BLE001
            yield sse_format("error", {"message": f"Revision failed: {exc}"})
            return
        html = extract_html(raw)
        if "<html" not in html.lower():
            yield sse_format("error", {"message": "The model did not return a valid website. Try again."})
            return
        site.html = html
        site.prompt = f"{site.prompt}\n[edit] {body.instruction}"
        await db.commit()
        await db.refresh(site)
        yield sse_format("done", {"site": SiteRead.model_validate(site).model_dump(mode="json")})

    return sse_response(run())


@router.get("/api/sites", response_model=list[SiteSummary])
async def list_sites(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[SiteSummary]:
    result = await db.execute(select(GeneratedSite).where(GeneratedSite.user_id == user.id).order_by(GeneratedSite.created_at.desc()))
    return [SiteSummary.model_validate(s) for s in result.scalars().all()]


@router.get("/api/sites/{site_id}", response_model=SiteRead)
async def get_site(site_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SiteRead:
    return SiteRead.model_validate(await _get_site(db, site_id, user))


@router.put("/api/sites/{site_id}", response_model=SiteRead)
async def update_site(site_id: int, body: SiteUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SiteRead:
    site = await _get_site(db, site_id, user)
    if body.name is not None:
        site.name = body.name.strip()[:255] or site.name
    if body.html is not None:
        site.html = body.html
    await db.commit()
    await db.refresh(site)
    return SiteRead.model_validate(site)


@router.delete("/api/sites/{site_id}", status_code=204)
async def delete_site(site_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    site = await _get_site(db, site_id, user)
    await db.delete(site)
    await db.commit()


@router.get("/preview/{share_id}", response_class=HTMLResponse)
async def preview_site(share_id: str, db: AsyncSession = Depends(get_db)):
    """Public live URL for a generated site — safe to open in a new tab or embed."""
    site = (
        await db.execute(select(GeneratedSite).where(GeneratedSite.share_id == share_id))
    ).scalar_one_or_none()
    if not site:
        return HTMLResponse(
            "<!DOCTYPE html><html><body style='font-family:sans-serif;display:grid;place-items:center;height:100vh'><h1>404 — Site not found</h1></body></html>",
            status_code=404,
        )
    return HTMLResponse(content=site.html, headers={"Cache-Control": "no-store"})


@router.get("/api/sites/{site_id}/download")
async def download_site(site_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    site = await _get_site(db, site_id, user)
    slug = "".join(c if c.isalnum() else "-" for c in site.name.lower()).strip("-")[:50] or "website"
    return Response(
        content=site.html,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="{slug}.html"'},
    )
