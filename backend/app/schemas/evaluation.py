from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.rag_run import RagRunResponse


class EvaluationResultRead(BaseModel):
    id: UUID
    evaluation_run_id: UUID
    faithfulness_score: float
    answer_relevance_score: float
    context_precision_score: float
    overall_score: float
    explanation: str
    evaluator_metadata: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RunAndEvaluateRequest(BaseModel):
    top_k: int = Field(default=3, ge=1, le=10)


class RunAndEvaluateResponse(BaseModel):
    success: bool
    rag_run: RagRunResponse
    evaluation_result: EvaluationResultRead