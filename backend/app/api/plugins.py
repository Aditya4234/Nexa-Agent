from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db import get_db
from app.models.user import User
from app.plugins.registry import CATALOG_BY_ID, PLUGIN_CATALOG, default_enabled_ids
from app.schemas.plugin import PluginRead, PluginToggle

router = APIRouter(prefix="/api/plugins", tags=["plugins"])


def _enabled_plugins(user: User) -> list[str]:
    prefs = user.preferences or {}
    return list(prefs.get("plugins", default_enabled_ids()))


def _set_enabled_plugins(user: User, enabled: list[str]) -> None:
    prefs = dict(user.preferences or {})
    prefs["plugins"] = enabled
    user.preferences = prefs


@router.get("", response_model=list[PluginRead])
async def list_plugins(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[PluginRead]:
    enabled = set(_enabled_plugins(user))
    return [
        PluginRead(
            id=p.id,
            name=p.name,
            description=p.description,
            icon=p.icon,
            category=p.category,
            scopes=p.scopes,
            requires_approval=p.requires_approval,
            enabled=p.id in enabled,
            connected=p.connected,
        )
        for p in PLUGIN_CATALOG
    ]


@router.get("/enabled", response_model=list[str])
async def list_enabled(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[str]:
    return _enabled_plugins(user)


@router.put("/{plugin_id}", response_model=PluginRead)
async def set_plugin(
    plugin_id: str,
    body: PluginToggle,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PluginRead:
    plugin = CATALOG_BY_ID.get(plugin_id)
    if not plugin:
        raise NotFoundError(f"Plugin '{plugin_id}' not found.")
    enabled = _enabled_plugins(user)
    if body.enabled and plugin_id not in enabled:
        enabled.append(plugin_id)
    elif not body.enabled and plugin_id in enabled:
        enabled.remove(plugin_id)
    _set_enabled_plugins(user, enabled)
    await db.commit()
    return PluginRead(
        id=plugin.id,
        name=plugin.name,
        description=plugin.description,
        icon=plugin.icon,
        category=plugin.category,
        scopes=plugin.scopes,
        requires_approval=plugin.requires_approval,
        enabled=body.enabled,
        connected=plugin.connected,
    )