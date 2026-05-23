from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.batch_evaluation_run import BatchEvaluationStatus


class BatchEvaluationRunRequest(BaseModel):
    top_k: int = Field(default=3, ge=1, le=10)


class BatchEvaluationRunRead(BaseModel):
    id: UUID
    project_id: UUID
    dataset_id: UUID
    status: BatchEvaluationStatus

    total_test_cases: int
    successful_runs: int
    failed_runs: int

    average_faithfulness_score: float
    average_answer_relevance_score: float
    average_context_precision_score: float
    average_overall_score: float

    run_ids: list[str]
    failed_items: list[dict]

    summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BatchEvaluationRunListResponse(BaseModel):
    success: bool
    count: int
    batch_runs: list[BatchEvaluationRunRead]