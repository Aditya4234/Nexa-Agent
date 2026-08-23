from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class Evaluation(Base, TimestampMixin):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("agents.id"), nullable=True)
    model: Mapped[str] = mapped_column(String(64), default="default")

    cases = relationship("EvalCase", back_populates="evaluation", cascade="all, delete-orphan")
    runs = relationship("EvalRun", back_populates="evaluation", cascade="all, delete-orphan")


class EvalCase(Base):
    __tablename__ = "eval_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    evaluation_id: Mapped[int] = mapped_column(ForeignKey("evaluations.id"), index=True)
    input: Mapped[str] = mapped_column(Text, default="")
    expected: Mapped[str] = mapped_column(Text, default="")

    evaluation = relationship("Evaluation", back_populates="cases")


class EvalRun(Base, TimestampMixin):
    __tablename__ = "eval_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    evaluation_id: Mapped[int] = mapped_column(ForeignKey("evaluations.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending | running | completed
    passed: Mapped[int] = mapped_column(Integer, default=0)
    failed: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    results: Mapped[list] = mapped_column(Text, default="[]")  # JSON list of case results

    evaluation = relationship("Evaluation", back_populates="runs")