from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TestCaseCreate(BaseModel):
    question: str = Field(..., min_length=3)
    expected_answer: str = Field(..., min_length=3)
    reference_context: str | None = None
    tags: str | None = None
    difficulty: int = Field(default=1, ge=1, le=5)


class TestCaseUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=3)
    expected_answer: str | None = Field(default=None, min_length=3)
    reference_context: str | None = None
    tags: str | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)


class TestCaseRead(BaseModel):
    id: UUID
    dataset_id: UUID
    project_id: UUID
    question: str
    expected_answer: str
    reference_context: str | None
    tags: str | None
    difficulty: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TestCaseListResponse(BaseModel):
    success: bool
    count: int
    test_cases: list[TestCaseRead]