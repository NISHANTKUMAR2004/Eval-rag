from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.evaluation import (
    EvaluationResultRead,
    RunAndEvaluateRequest,
    RunAndEvaluateResponse,
)
from app.schemas.rag_run import RagRunResponse
from app.services.evaluation_service import evaluation_service

router = APIRouter(tags=["Evaluations"])


@router.post(
    "/projects/{project_id}/datasets/{dataset_id}/test-cases/{test_case_id}/run-and-evaluate",
    response_model=RunAndEvaluateResponse,
    status_code=status.HTTP_201_CREATED,
)
def run_and_evaluate_test_case(
    project_id: UUID,
    dataset_id: UUID,
    test_case_id: UUID,
    payload: RunAndEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        evaluation_run, evaluation_result = (
            evaluation_service.run_and_evaluate_single_test_case(
                db=db,
                project_id=project_id,
                dataset_id=dataset_id,
                test_case_id=test_case_id,
                top_k=payload.top_k,
                current_user=current_user,
            )
        )

        generated_answer = evaluation_run.generated_answer

        rag_run_response = RagRunResponse(
            success=True,
            run_id=evaluation_run.id,
            project_id=evaluation_run.project_id,
            dataset_id=evaluation_run.dataset_id,
            test_case_id=evaluation_run.test_case_id,
            query=evaluation_run.query,
            retrieved_context=evaluation_run.retrieved_context,
            generated_answer=generated_answer,
            created_at=evaluation_run.created_at,
        )

        return RunAndEvaluateResponse(
            success=True,
            rag_run=rag_run_response,
            evaluation_result=evaluation_result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/projects/{project_id}/runs/{run_id}/evaluation-result",
    response_model=EvaluationResultRead,
)
def get_evaluation_result(
    project_id: UUID,
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    evaluation_result = evaluation_service.get_evaluation_result_for_run(
        db,
        project_id,
        run_id,
        current_user,
    )

    if not evaluation_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation result not found",
        )

    return evaluation_result