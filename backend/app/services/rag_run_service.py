from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.dataset import EvaluationDataset
from app.db.models.evaluation_run import EvaluationRun, EvaluationRunStatus
from app.db.models.generated_answer import GeneratedAnswer
from app.db.models.project import Project
from app.db.models.test_case import TestCase
from app.db.models.user import User
from app.schemas.rag_run import RetrievedContextItem
from app.services.llm_service import llm_service
from app.services.search_service import search_service


class RagRunService:
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

    def get_test_case_for_user(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        test_case_id: UUID,
        current_user: User,
    ) -> TestCase | None:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            return None

        dataset = (
            db.query(EvaluationDataset)
            .filter(
                EvaluationDataset.id == dataset_id,
                EvaluationDataset.project_id == project.id,
                EvaluationDataset.is_deleted.is_(False),
            )
            .first()
        )

        if not dataset:
            return None

        return (
            db.query(TestCase)
            .filter(
                TestCase.id == test_case_id,
                TestCase.dataset_id == dataset.id,
                TestCase.project_id == project.id,
                TestCase.is_deleted.is_(False),
            )
            .first()
        )

    def run_single_test_case(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        test_case_id: UUID,
        top_k: int,
        current_user: User,
    ) -> tuple[EvaluationRun, GeneratedAnswer, list[RetrievedContextItem]]:
        test_case = self.get_test_case_for_user(
            db,
            project_id,
            dataset_id,
            test_case_id,
            current_user,
        )

        if not test_case:
            raise ValueError("Test case not found")

        search_results = search_service.search_project(
            db=db,
            project_id=project_id,
            query=test_case.question,
            top_k=top_k,
            current_user=current_user,
        )

        retrieved_context = [
            RetrievedContextItem(
                chunk_id=result.chunk_id,
                document_id=result.document_id,
                chunk_index=result.chunk_index,
                content=result.content,
                score=result.score,
            )
            for result in search_results
        ]

        retrieved_context_json = [
            item.model_dump(mode="json") for item in retrieved_context
        ]

        answer_text = llm_service.generate_answer(
            question=test_case.question,
            retrieved_contexts=[item.content for item in retrieved_context],
        )

        evaluation_run = EvaluationRun(
            project_id=project_id,
            dataset_id=dataset_id,
            test_case_id=test_case_id,
            status=EvaluationRunStatus.COMPLETED,
            query=test_case.question,
            retrieved_context=retrieved_context_json,
        )

        db.add(evaluation_run)
        db.flush()

        generated_answer = GeneratedAnswer(
            evaluation_run_id=evaluation_run.id,
            answer_text=answer_text,
        )

        db.add(generated_answer)
        db.commit()

        db.refresh(evaluation_run)
        db.refresh(generated_answer)

        return evaluation_run, generated_answer, retrieved_context


rag_run_service = RagRunService()