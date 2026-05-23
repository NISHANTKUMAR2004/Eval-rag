import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EvaluationRunStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evaluation_datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    test_case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("test_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[EvaluationRunStatus] = mapped_column(
        SqlEnum(EvaluationRunStatus, name="evaluation_run_status"),
        default=EvaluationRunStatus.COMPLETED,
        nullable=False,
    )

    query: Mapped[str] = mapped_column(Text, nullable=False)

    retrieved_context: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    generated_answer = relationship(
        "GeneratedAnswer",
        back_populates="evaluation_run",
        uselist=False,
        cascade="all, delete-orphan",
    )
    evaluation_result = relationship(
    "EvaluationResult",
    back_populates="evaluation_run",
    uselist=False,
    cascade="all, delete-orphan",
    )