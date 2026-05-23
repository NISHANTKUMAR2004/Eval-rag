from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.rag_run import RagRunRequest, RagRunResponse
from app.services.rag_run_service import rag_run_service

router = APIRouter(
    prefix="/projects/{project_id}/datasets/{dataset_id}/test-cases/{test_case_id}",
    tags=["RAG Runs"],
)


@router.post("/run", response_model=RagRunResponse, status_code=status.HTTP_201_CREATED)
def run_test_case(
    project_id: UUID,
    dataset_id: UUID,
    test_case_id: UUID,
    payload: RagRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        evaluation_run, generated_answer, retrieved_context = (
            rag_run_service.run_single_test_case(
                db=db,
                project_id=project_id,
                dataset_id=dataset_id,
                test_case_id=test_case_id,
                top_k=payload.top_k,
                current_user=current_user,
            )
        )

        return RagRunResponse(
            success=True,
            run_id=evaluation_run.id,
            project_id=evaluation_run.project_id,
            dataset_id=evaluation_run.dataset_id,
            test_case_id=evaluation_run.test_case_id,
            query=evaluation_run.query,
            retrieved_context=retrieved_context,
            generated_answer=generated_answer,
            created_at=evaluation_run.created_at,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc