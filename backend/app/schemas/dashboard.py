from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.db.models.batch_evaluation_run import BatchEvaluationStatus


class ScoreSummary(BaseModel):
    average_faithfulness_score: float
    average_answer_relevance_score: float
    average_context_precision_score: float
    average_overall_score: float


class DashboardDatasetSummary(BaseModel):
    dataset_id: UUID
    dataset_name: str
    total_test_cases: int
    total_batch_runs: int
    latest_batch_run_id: UUID | None
    latest_score_summary: ScoreSummary | None


class RecentBatchRunItem(BaseModel):
    id: UUID
    dataset_id: UUID
    dataset_name: str | None
    status: BatchEvaluationStatus
    total_test_cases: int
    successful_runs: int
    failed_runs: int
    average_overall_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectDashboardSummary(BaseModel):
    success: bool
    project_id: UUID
    project_name: str

    total_documents: int
    total_chunks: int
    total_datasets: int
    total_test_cases: int
    total_batch_runs: int

    latest_batch_run_id: UUID | None
    latest_score_summary: ScoreSummary | None

    datasets: list[DashboardDatasetSummary]


class RecentBatchRunsResponse(BaseModel):
    success: bool
    count: int
    batch_runs: list[RecentBatchRunItem]


class DatasetDashboardSummary(BaseModel):
    success: bool
    project_id: UUID
    dataset_id: UUID
    dataset_name: str

    total_test_cases: int
    total_batch_runs: int
    latest_batch_run_id: UUID | None
    latest_score_summary: ScoreSummary | None

    recent_batch_runs: list[RecentBatchRunItem]