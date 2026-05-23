from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.dataset import EvaluationDataset
from app.db.models.project import Project
from app.db.models.user import User
from app.schemas.dataset import DatasetCreate, DatasetUpdate


class DatasetService:
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

    def create_dataset(
        self,
        db: Session,
        project_id: UUID,
        payload: DatasetCreate,
        current_user: User,
    ) -> EvaluationDataset:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        dataset = EvaluationDataset(
            project_id=project.id,
            name=payload.name,
            description=payload.description,
        )

        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return dataset

    def list_datasets(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ) -> list[EvaluationDataset]:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        return (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.project_id == project.id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .order_by(EvaluationDataset.created_at.desc())
            .all()
        )

    def get_dataset_by_id(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        current_user: User,
    ) -> EvaluationDataset | None:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        return (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.id == dataset_id,
                EvaluationDataset.project_id == project.id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .first()
        )

    def update_dataset(
        self,
        db: Session,
        dataset: EvaluationDataset,
        payload: DatasetUpdate,
    ) -> EvaluationDataset:
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(dataset, field, value)

        db.commit()
        db.refresh(dataset)

        return dataset

    def delete_dataset(
        self,
        db: Session,
        dataset: EvaluationDataset,
    ) -> None:
        dataset.is_deleted = True
        db.commit()


dataset_service = DatasetService()