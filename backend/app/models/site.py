from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.user import TimestampMixin


class GeneratedSite(Base, TimestampMixin):
    __tablename__ = "generated_sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), default="Untitled Site")
    prompt: Mapped[str] = mapped_column(Text)
    html: Mapped[str] = mapped_column(Text, default="")
    share_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    model: Mapped[str] = mapped_column(String(64), default="")
