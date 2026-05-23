from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RagRunRequest(BaseModel):
    top_k: int = Field(default=3, ge=1, le=10)


class RetrievedContextItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    score: float


class GeneratedAnswerRead(BaseModel):
    id: UUID
    evaluation_run_id: UUID
    answer_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RagRunResponse(BaseModel):
    success: bool
    run_id: UUID
    project_id: UUID
    dataset_id: UUID
    test_case_id: UUID
    query: str
    retrieved_context: list[RetrievedContextItem]
    generated_answer: GeneratedAnswerRead
    created_at: datetime