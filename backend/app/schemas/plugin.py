from pydantic import BaseModel


class PluginRead(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    scopes: list[str]
    requires_approval: bool
    enabled: bool
    connected: bool


class PluginToggle(BaseModel):
    enabled: bool