from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseListResponse,
    TestCaseRead,
    TestCaseUpdate,
)
from app.services.test_case_service import test_case_service

router = APIRouter(
    prefix="/projects/{project_id}/datasets/{dataset_id}/test-cases",
    tags=["Test Cases"],
)


@router.post("", response_model=TestCaseRead, status_code=status.HTTP_201_CREATED)
def create_test_case(
    project_id: UUID,
    dataset_id: UUID,
    payload: TestCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return test_case_service.create_test_case(
            db,
            project_id,
            dataset_id,
            payload,
            current_user,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("", response_model=TestCaseListResponse)
def list_test_cases(
    project_id: UUID,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        test_cases = test_case_service.list_test_cases(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        return TestCaseListResponse(
            success=True,
            count=len(test_cases),
            test_cases=test_cases,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/{test_case_id}", response_model=TestCaseRead)
def get_test_case(
    project_id: UUID,
    dataset_id: UUID,
    test_case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        test_case = test_case_service.get_test_case_by_id(
            db,
            project_id,
            dataset_id,
            test_case_id,
            current_user,
        )

        if not test_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found",
            )

        return test_case

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.patch("/{test_case_id}", response_model=TestCaseRead)
def update_test_case(
    project_id: UUID,
    dataset_id: UUID,
    test_case_id: UUID,
    payload: TestCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        test_case = test_case_service.get_test_case_by_id(
            db,
            project_id,
            dataset_id,
            test_case_id,
            current_user,
        )

        if not test_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found",
            )

        return test_case_service.update_test_case(db, test_case, payload)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete("/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_case(
    project_id: UUID,
    dataset_id: UUID,
    test_case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        test_case = test_case_service.get_test_case_by_id(
            db,
            project_id,
            dataset_id,
            test_case_id,
            current_user,
        )

        if not test_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found",
            )

        test_case_service.delete_test_case(db, test_case)

        return None

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc