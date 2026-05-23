from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.batch_evaluation_run import BatchEvaluationRun
from app.db.models.chunk import DocumentChunk
from app.db.models.dataset import EvaluationDataset
from app.db.models.document import Document
from app.db.models.project import Project
from app.db.models.test_case import TestCase
from app.db.models.user import User
from app.schemas.dashboard import (
    DashboardDatasetSummary,
    RecentBatchRunItem,
    ScoreSummary,
)


class DashboardService:
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

    def _score_summary_from_batch_run(
        self,
        batch_run: BatchEvaluationRun | None,
    ) -> ScoreSummary | None:
        if not batch_run:
            return None

        return ScoreSummary(
            average_faithfulness_score=batch_run.average_faithfulness_score,
            average_answer_relevance_score=batch_run.average_answer_relevance_score,
            average_context_precision_score=batch_run.average_context_precision_score,
            average_overall_score=batch_run.average_overall_score,
        )

    def _get_dataset_name_map(
        self,
        db: Session,
        project_id: UUID,
    ) -> dict[UUID, str]:
        datasets = (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.project_id == project_id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .all()
        )

        return {dataset.id: dataset.name for dataset in datasets}

    def _to_recent_batch_run_item(
        self,
        batch_run: BatchEvaluationRun,
        dataset_name_map: dict[UUID, str],
    ) -> RecentBatchRunItem:
        return RecentBatchRunItem(
            id=batch_run.id,
            dataset_id=batch_run.dataset_id,
            dataset_name=dataset_name_map.get(batch_run.dataset_id),
            status=batch_run.status,
            total_test_cases=batch_run.total_test_cases,
            successful_runs=batch_run.successful_runs,
            failed_runs=batch_run.failed_runs,
            average_overall_score=batch_run.average_overall_score,
            created_at=batch_run.created_at,
        )

    def get_project_summary(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ):
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        total_documents = (
            db.query(Document)
            .filter(
                Document.project_id == project_id,
                Document.is_deleted.is_(False),
            )
            .count()
        )

        total_chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.project_id == project_id)
            .count()
        )

        datasets = (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.project_id == project_id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .order_by(EvaluationDataset.created_at.desc())
            .all()
        )

        total_datasets = len(datasets)

        total_test_cases = (
            db.query(TestCase)
            .filter(
                TestCase.project_id == project_id,
                TestCase.is_deleted.is_(False),
            )
            .count()
        )

        total_batch_runs = (
            db.query(BatchEvaluationRun)
            .filter(BatchEvaluationRun.project_id == project_id)
            .count()
        )

        latest_batch_run = (
            db.query(BatchEvaluationRun)
            .filter(BatchEvaluationRun.project_id == project_id)
            .order_by(BatchEvaluationRun.created_at.desc())
            .first()
        )

        dataset_summaries: list[DashboardDatasetSummary] = []

        for dataset in datasets:
            dataset_test_cases_count = (
                db.query(TestCase)
                .filter(
                    TestCase.dataset_id == dataset.id,
                    TestCase.project_id == project_id,
                    TestCase.is_deleted.is_(False),
                )
                .count()
            )

            dataset_batch_runs_count = (
                db.query(BatchEvaluationRun)
                .filter(
                    BatchEvaluationRun.project_id == project_id,
                    BatchEvaluationRun.dataset_id == dataset.id,
                )
                .count()
            )

            latest_dataset_batch_run = (
                db.query(BatchEvaluationRun)
                .filter(
                    BatchEvaluationRun.project_id == project_id,
                    BatchEvaluationRun.dataset_id == dataset.id,
                )
                .order_by(BatchEvaluationRun.created_at.desc())
                .first()
            )

            dataset_summaries.append(
                DashboardDatasetSummary(
                    dataset_id=dataset.id,
                    dataset_name=dataset.name,
                    total_test_cases=dataset_test_cases_count,
                    total_batch_runs=dataset_batch_runs_count,
                    latest_batch_run_id=(
                        latest_dataset_batch_run.id
                        if latest_dataset_batch_run
                        else None
                    ),
                    latest_score_summary=self._score_summary_from_batch_run(
                        latest_dataset_batch_run
                    ),
                )
            )

        return {
            "project": project,
            "total_documents": total_documents,
            "total_chunks": total_chunks,
            "total_datasets": total_datasets,
            "total_test_cases": total_test_cases,
            "total_batch_runs": total_batch_runs,
            "latest_batch_run": latest_batch_run,
            "latest_score_summary": self._score_summary_from_batch_run(
                latest_batch_run
            ),
            "datasets": dataset_summaries,
        }

    def get_recent_batch_runs(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
        limit: int = 5,
    ) -> list[RecentBatchRunItem]:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        dataset_name_map = self._get_dataset_name_map(db, project_id)

        batch_runs = (
            db.query(BatchEvaluationRun)
            .filter(BatchEvaluationRun.project_id == project_id)
            .order_by(BatchEvaluationRun.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            self._to_recent_batch_run_item(batch_run, dataset_name_map)
            for batch_run in batch_runs
        ]

    def get_dataset_summary(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        current_user: User,
    ):
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        dataset = (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.id == dataset_id,
                EvaluationDataset.project_id == project_id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .first()
        )

        if not dataset:
            raise ValueError("Dataset not found")

        total_test_cases = (
            db.query(TestCase)
            .filter(
                TestCase.dataset_id == dataset_id,
                TestCase.project_id == project_id,
                TestCase.is_deleted.is_(False),
            )
            .count()
        )

        total_batch_runs = (
            db.query(BatchEvaluationRun)
            .filter(
                BatchEvaluationRun.project_id == project_id,
                BatchEvaluationRun.dataset_id == dataset_id,
            )
            .count()
        )

        latest_batch_run = (
            db.query(BatchEvaluationRun)
            .filter(
                BatchEvaluationRun.project_id == project_id,
                BatchEvaluationRun.dataset_id == dataset_id,
            )
            .order_by(BatchEvaluationRun.created_at.desc())
            .first()
        )

        dataset_name_map = {dataset.id: dataset.name}

        recent_batch_runs = (
            db.query(BatchEvaluationRun)
            .filter(
                BatchEvaluationRun.project_id == project_id,
                BatchEvaluationRun.dataset_id == dataset_id,
            )
            .order_by(BatchEvaluationRun.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "dataset": dataset,
            "total_test_cases": total_test_cases,
            "total_batch_runs": total_batch_runs,
            "latest_batch_run": latest_batch_run,
            "latest_score_summary": self._score_summary_from_batch_run(
                latest_batch_run
            ),
            "recent_batch_runs": [
                self._to_recent_batch_run_item(item, dataset_name_map)
                for item in recent_batch_runs
            ],
        }


dashboard_service = DashboardService()