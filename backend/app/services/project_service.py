from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.project import Project
from app.db.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def create_project(
        self,
        db: Session,
        payload: ProjectCreate,
        current_user: User,
    ) -> Project:
        project = Project(
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            owner_id=current_user.id,
        )

        db.add(project)
        db.commit()
        db.refresh(project)

        return project

    def list_projects(
        self,
        db: Session,
        current_user: User,
    ) -> list[Project]:
        return (
            db.query(Project)
            .filter(
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
            )
            .order_by(Project.created_at.desc())
            .all()
        )

    def get_project_by_id(
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

    def update_project(
        self,
        db: Session,
        project: Project,
        payload: ProjectUpdate,
    ) -> Project:
        update_data = payload.model_dump(exclude_unset=True)

        if "name" in update_data and update_data["name"] is not None:
            project.name = update_data["name"].strip()

        if "description" in update_data:
            description = update_data["description"]
            project.description = description.strip() if description else None

        if "status" in update_data and update_data["status"] is not None:
            project.status = update_data["status"]

        db.commit()
        db.refresh(project)

        return project

    def soft_delete_project(
        self,
        db: Session,
        project: Project,
    ) -> None:
        project.is_deleted = True
        db.commit()


project_service = ProjectService()