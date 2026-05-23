from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.evaluation_result import EvaluationResult
from app.db.models.evaluation_run import EvaluationRun
from app.db.models.test_case import TestCase
from app.db.models.user import User
from app.services.evaluator_service import evaluator_service
from app.services.rag_run_service import rag_run_service


class EvaluationService:
    def run_and_evaluate_single_test_case(
        self,
        db: Session,
        project_id: UUID,
        dataset_id: UUID,
        test_case_id: UUID,
        top_k: int,
        current_user: User,
    ) -> tuple[EvaluationRun, EvaluationResult]:
        evaluation_run, generated_answer, retrieved_context = (
            rag_run_service.run_single_test_case(
                db=db,
                project_id=project_id,
                dataset_id=dataset_id,
                test_case_id=test_case_id,
                top_k=top_k,
                current_user=current_user,
            )
        )

        test_case = (
            db.query(TestCase)
            .filter(
                TestCase.id == test_case_id,
                TestCase.dataset_id == dataset_id,
                TestCase.project_id == project_id,
                TestCase.is_deleted.is_(False),
            )
            .first()
        )

        if not test_case:
            raise ValueError("Test case not found")

        retrieved_contexts = [item.content for item in retrieved_context]

        faithfulness_score = evaluator_service.score_faithfulness(
            generated_answer.answer_text,
            retrieved_contexts,
        )

        answer_relevance_score = evaluator_service.score_answer_relevance(
            test_case.question,
            test_case.expected_answer,
            generated_answer.answer_text,
        )

        context_precision_score = evaluator_service.score_context_precision(
            test_case.question,
            retrieved_contexts,
        )

        overall_score = round(
            (
                faithfulness_score * 0.4
                + answer_relevance_score * 0.4
                + context_precision_score * 0.2
            ),
            4,
        )

        explanation = evaluator_service.build_explanation(
            faithfulness_score,
            answer_relevance_score,
            context_precision_score,
            overall_score,
        )

        evaluation_result = EvaluationResult(
            evaluation_run_id=evaluation_run.id,
            faithfulness_score=faithfulness_score,
            answer_relevance_score=answer_relevance_score,
            context_precision_score=context_precision_score,
            overall_score=overall_score,
            explanation=explanation,
            evaluator_metadata={
                "method": "lexical_jaccard_placeholder",
                "weights": {
                    "faithfulness": 0.4,
                    "answer_relevance": 0.4,
                    "context_precision": 0.2,
                },
            },
        )

        db.add(evaluation_result)
        db.commit()
        db.refresh(evaluation_result)

        return evaluation_run, evaluation_result

    def get_evaluation_result_for_run(
        self,
        db: Session,
        project_id: UUID,
        run_id: UUID,
        current_user: User,
    ) -> EvaluationResult | None:
        # Ownership check through EvaluationRun -> project
        evaluation_run = (
            db.query(EvaluationRun)
            .filter(
                EvaluationRun.id == run_id,
                EvaluationRun.project_id == project_id,
            )
            .first()
        )

        if not evaluation_run:
            return None

        # Reuse existing project ownership check
        project = rag_run_service.get_project_for_user(
            db,
            project_id,
            current_user,
        )

        if not project:
            return None

        return (
            db.query(EvaluationResult)
            .filter(EvaluationResult.evaluation_run_id == run_id)
            .first()
        )


evaluation_service = EvaluationService()