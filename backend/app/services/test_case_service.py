from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.dataset import EvaluationDataset
from app.db.models.project import Project
from app.db.models.test_case import TestCase
from app.db.models.user import User
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate


class TestCaseService:
    def get_project_for_user(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ) -> Project | None:
        return (
            db.query(Project)
            .filter(
                Project.id == project_id,
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
            )
            .first()
        )

    def get_dataset_for_user(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        current_user: User,
    ) -> EvaluationDataset | None:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            return None

        return (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.id == dataset_id,
                EvaluationDataset.project_id == project.id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .first()
        )

    def create_test_case(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        payload: TestCaseCreate,
        current_user: User,
    ) -> TestCase:
        dataset = self.get_dataset_for_user(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        if not dataset:
            raise ValueError("Dataset not found")

        test_case = TestCase(
            dataset_id=dataset.id,
            project_id=project_id,
            question=payload.question,
            expected_answer=payload.expected_answer,
            reference_context=payload.reference_context,
            tags=payload.tags,
            difficulty=payload.difficulty,
        )

        db.add(test_case)
        db.commit()
        db.refresh(test_case)

        return test_case

    def list_test_cases(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        current_user: User,
    ) -> list[TestCase]:
        dataset = self.get_dataset_for_user(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        if not dataset:
            raise ValueError("Dataset not found")

        return (
            db.query(TestCase)
            .filter(
                TestCase.dataset_id == dataset.id,
                TestCase.project_id == project_id,
                TestCase.is_deleted.is_(False),
            )
            .order_by(TestCase.created_at.desc())
            .all()
        )

    def get_test_case_by_id(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        test_case_id: UUID,
        current_user: User,
    ) -> TestCase | None:
        dataset = self.get_dataset_for_user(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        if not dataset:
            raise ValueError("Dataset not found")

        return (
            db.query(TestCase)
            .filter(
                TestCase.id == test_case_id,
                TestCase.dataset_id == dataset.id,
                TestCase.project_id == project_id,
                TestCase.is_deleted.is_(False),
            )
            .first()
        )

    def update_test_case(
        self,
        db: Session,
        test_case: TestCase,
        payload: TestCaseUpdate,
    ) -> TestCase:
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(test_case, field, value)

        db.commit()
        db.refresh(test_case)

        return test_case

    def delete_test_case(
        self,
        db: Session,
        test_case: TestCase,
    ) -> None:
        test_case.is_deleted = True
        db.commit()


test_case_service = TestCaseService()