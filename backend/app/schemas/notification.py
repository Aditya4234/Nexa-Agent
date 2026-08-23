from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: int
    title: str
    body: str
    type: str
    link: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}