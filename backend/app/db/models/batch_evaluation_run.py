import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BatchEvaluationStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"


class BatchEvaluationRun(Base):
    __tablename__ = "batch_evaluation_runs"

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

    status: Mapped[BatchEvaluationStatus] = mapped_column(
        SqlEnum(BatchEvaluationStatus, name="batch_evaluation_status"),
        default=BatchEvaluationStatus.COMPLETED,
        nullable=False,
    )

    total_test_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    successful_runs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_runs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    average_faithfulness_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    average_answer_relevance_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    average_context_precision_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    average_overall_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    run_ids: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    failed_items: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)

    summary: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )