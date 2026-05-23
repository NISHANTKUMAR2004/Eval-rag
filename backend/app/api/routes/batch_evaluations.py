from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.batch_evaluation import (
    BatchEvaluationRunListResponse,
    BatchEvaluationRunRead,
    BatchEvaluationRunRequest,
)
from app.services.batch_evaluation_service import batch_evaluation_service

router = APIRouter(
    prefix="/projects/{project_id}/datasets/{dataset_id}/batch-runs",
    tags=["Batch Evaluations"],
)


@router.post(
    "",
    response_model=BatchEvaluationRunRead,
    status_code=status.HTTP_201_CREATED,
)
def run_batch_evaluation(
    project_id: UUID,
    dataset_id: UUID,
    payload: BatchEvaluationRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return batch_evaluation_service.run_dataset_evaluation(
            db=db,
            project_id=project_id,
            dataset_id=dataset_id,
            top_k=payload.top_k,
            current_user=current_user,
        )

    except ValueError as exc:
        message = str(exc)

        status_code = (
            status.HTTP_400_BAD_REQUEST
            if message == "Dataset has no test cases"
            else status.HTTP_404_NOT_FOUND
        )

        raise HTTPException(
            status_code=status_code,
            detail=message,
        ) from exc


@router.get("", response_model=BatchEvaluationRunListResponse)
def list_batch_evaluations(
    project_id: UUID,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        batch_runs = batch_evaluation_service.list_batch_runs(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        return BatchEvaluationRunListResponse(
            success=True,
            count=len(batch_runs),
            batch_runs=batch_runs,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/{batch_run_id}", response_model=BatchEvaluationRunRead)
def get_batch_evaluation(
    project_id: UUID,
    dataset_id: UUID,
    batch_run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        batch_run = batch_evaluation_service.get_batch_run_by_id(
            db,
            project_id,
            dataset_id,
            batch_run_id,
            current_user,
        )

        if not batch_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch evaluation run not found",
            )

        return batch_run

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc