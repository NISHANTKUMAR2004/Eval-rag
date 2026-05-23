from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.db.models.batch_evaluation_run import BatchEvaluationRun
from app.db.models.chunk import DocumentChunk
from app.db.models.dataset import EvaluationDataset
from app.db.models.document import Document
from app.db.models.project import Project
from app.db.models.test_case import TestCase
from app.schemas.dashboard import (
    DatasetDashboardSummary,
    ProjectDashboardSummary,
    RecentBatchRunsResponse,
)
from app.services.dashboard_service import dashboard_service


class DashboardStats(BaseModel):
    success: bool = True
    stats: dict


# Global stats router (no project_id prefix)
global_stats_router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@global_stats_router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get overall dashboard statistics for the current user across all projects."""
    try:
        projects_count = (
            db.query(Project)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
            )
            .count()
        )

        documents_count = (
            db.query(Document)
            .join(Project, Document.project_id == Project.id)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
                Document.is_deleted.is_(False),
            )
            .count()
        )

        chunks_count = (
            db.query(DocumentChunk)
            .join(Document, DocumentChunk.document_id == Document.id)
            .join(Project, Document.project_id == Project.id)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
                Document.is_deleted.is_(False),
            )
            .count()
        )

        datasets_count = (
            db.query(EvaluationDataset)
            .join(Project, EvaluationDataset.project_id == Project.id)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
                EvaluationDataset.is_deleted.is_(False),
            )
            .count()
        )

        test_cases_count = (
            db.query(TestCase)
            .join(EvaluationDataset, TestCase.dataset_id == EvaluationDataset.id)
            .join(Project, EvaluationDataset.project_id == Project.id)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
                EvaluationDataset.is_deleted.is_(False),
                TestCase.is_deleted.is_(False),
            )
            .count()
        )

        evaluation_runs_count = (
            db.query(BatchEvaluationRun)
            .join(EvaluationDataset, BatchEvaluationRun.dataset_id == EvaluationDataset.id)
            .join(Project, EvaluationDataset.project_id == Project.id)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
                EvaluationDataset.is_deleted.is_(False),
            )
            .count()
        )

        return DashboardStats(
            success=True,
            stats={
                "projects_count": projects_count,
                "documents_count": documents_count,
                "chunks_count": chunks_count,
                "datasets_count": datasets_count,
                "test_cases_count": test_cases_count,
                "evaluation_runs_count": evaluation_runs_count,
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard stats: {str(exc)}",
        ) from exc


# Project-specific dashboard router
router = APIRouter(
    prefix="/projects/{project_id}/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary", response_model=ProjectDashboardSummary)
def get_project_dashboard_summary(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        summary = dashboard_service.get_project_summary(
            db,
            project_id,
            current_user,
        )

        latest_batch_run = summary["latest_batch_run"]

        return ProjectDashboardSummary(
            success=True,
            project_id=project_id,
            project_name=summary["project"].name,
            total_documents=summary["total_documents"],
            total_chunks=summary["total_chunks"],
            total_datasets=summary["total_datasets"],
            total_test_cases=summary["total_test_cases"],
            total_batch_runs=summary["total_batch_runs"],
            latest_batch_run_id=latest_batch_run.id if latest_batch_run else None,
            latest_score_summary=summary["latest_score_summary"],
            datasets=summary["datasets"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/recent-batch-runs", response_model=RecentBatchRunsResponse)
def get_recent_batch_runs(
    project_id: UUID,
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        batch_runs = dashboard_service.get_recent_batch_runs(
            db,
            project_id,
            current_user,
            limit,
        )

        return RecentBatchRunsResponse(
            success=True,
            count=len(batch_runs),
            batch_runs=batch_runs,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/datasets/{dataset_id}/summary", response_model=DatasetDashboardSummary)
def get_dataset_dashboard_summary(
    project_id: UUID,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        summary = dashboard_service.get_dataset_summary(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        latest_batch_run = summary["latest_batch_run"]

        return DatasetDashboardSummary(
            success=True,
            project_id=project_id,
            dataset_id=dataset_id,
            dataset_name=summary["dataset"].name,
            total_test_cases=summary["total_test_cases"],
            total_batch_runs=summary["total_batch_runs"],
            latest_batch_run_id=latest_batch_run.id if latest_batch_run else None,
            latest_score_summary=summary["latest_score_summary"],
            recent_batch_runs=summary["recent_batch_runs"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc