from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.batch_evaluation_run import (
    BatchEvaluationRun,
    BatchEvaluationStatus,
)
from app.db.models.dataset import EvaluationDataset
from app.db.models.evaluation_result import EvaluationResult
from app.db.models.project import Project
from app.db.models.test_case import TestCase
from app.db.models.user import User
from app.services.evaluation_service import evaluation_service


class BatchEvaluationService:
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

    def run_dataset_evaluation(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        top_k: int,
        current_user: User,
    ) -> BatchEvaluationRun:
        dataset = self.get_dataset_for_user(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        if not dataset:
            raise ValueError("Dataset not found")

        test_cases = (
            db.query(TestCase)
            .filter(
                TestCase.dataset_id == dataset.id,
                TestCase.project_id == project_id,
                TestCase.is_deleted.is_(False),
            )
            .order_by(TestCase.created_at.asc())
            .all()
        )

        if not test_cases:
            raise ValueError("Dataset has no test cases")

        run_ids: list[str] = []
        failed_items: list[dict] = []
        result_ids: list[UUID] = []

        for test_case in test_cases:
            try:
                evaluation_run, evaluation_result = (
                    evaluation_service.run_and_evaluate_single_test_case(
                        db=db,
                        project_id=project_id,
                        dataset_id=dataset_id,
                        test_case_id=test_case.id,
                        top_k=top_k,
                        current_user=current_user,
                    )
                )

                run_ids.append(str(evaluation_run.id))
                result_ids.append(evaluation_result.id)

            except Exception as exc:
                failed_items.append(
                    {
                        "test_case_id": str(test_case.id),
                        "question": test_case.question,
                        "error": str(exc),
                    }
                )

        successful_runs = len(run_ids)
        failed_runs = len(failed_items)
        total_test_cases = len(test_cases)

        evaluation_results = (
            db.query(EvaluationResult)
            .filter(EvaluationResult.id.in_(result_ids))
            .all()
            if result_ids
            else []
        )

        if evaluation_results:
            average_faithfulness_score = round(
                sum(item.faithfulness_score for item in evaluation_results)
                / len(evaluation_results),
                4,
            )
            average_answer_relevance_score = round(
                sum(item.answer_relevance_score for item in evaluation_results)
                / len(evaluation_results),
                4,
            )
            average_context_precision_score = round(
                sum(item.context_precision_score for item in evaluation_results)
                / len(evaluation_results),
                4,
            )
            average_overall_score = round(
                sum(item.overall_score for item in evaluation_results)
                / len(evaluation_results),
                4,
            )
        else:
            average_faithfulness_score = 0.0
            average_answer_relevance_score = 0.0
            average_context_precision_score = 0.0
            average_overall_score = 0.0

        status = (
            BatchEvaluationStatus.COMPLETED
            if successful_runs > 0
            else BatchEvaluationStatus.FAILED
        )

        summary = (
            f"Batch evaluation completed. "
            f"Total test cases={total_test_cases}, "
            f"successful={successful_runs}, "
            f"failed={failed_runs}, "
            f"average overall score={average_overall_score}."
        )

        batch_run = BatchEvaluationRun(
            project_id=project_id,
            dataset_id=dataset_id,
            status=status,
            total_test_cases=total_test_cases,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            average_faithfulness_score=average_faithfulness_score,
            average_answer_relevance_score=average_answer_relevance_score,
            average_context_precision_score=average_context_precision_score,
            average_overall_score=average_overall_score,
            run_ids=run_ids,
            failed_items=failed_items,
            summary=summary,
        )

        db.add(batch_run)
        db.commit()
        db.refresh(batch_run)

        return batch_run

    def list_batch_runs(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        current_user: User,
    ) -> list[BatchEvaluationRun]:
        dataset = self.get_dataset_for_user(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        if not dataset:
            raise ValueError("Dataset not found")

        return (
            db.query(BatchEvaluationRun)
            .filter(
                BatchEvaluationRun.project_id == project_id,
                BatchEvaluationRun.dataset_id == dataset_id,
            )
            .order_by(BatchEvaluationRun.created_at.desc())
            .all()
        )

    def get_batch_run_by_id(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        batch_run_id: UUID,
        current_user: User,
    ) -> BatchEvaluationRun | None:
        dataset = self.get_dataset_for_user(
            db,
            project_id,
            dataset_id,
            current_user,
        )

        if not dataset:
            raise ValueError("Dataset not found")

        return (
            db.query(BatchEvaluationRun)
            .filter(
                BatchEvaluationRun.id == batch_run_id,
                BatchEvaluationRun.project_id == project_id,
                BatchEvaluationRun.dataset_id == dataset_id,
            )
            .first()
        )


batch_evaluation_service = BatchEvaluationService()