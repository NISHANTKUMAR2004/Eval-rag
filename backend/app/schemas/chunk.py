from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChunkRead(BaseModel):
    id: UUID
    document_id: UUID
    project_id: UUID
    chunk_index: int
    content: str
    token_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChunkListResponse(BaseModel):
    success: bool
    count: int
    chunks: list[ChunkRead]


class ProcessDocumentResponse(BaseModel):
    success: bool
    document_id: UUID
    chunks_created: int
    message: str


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    chunk_id: UUID
    document_id: UUID
    project_id: UUID
    chunk_index: int
    content: str
    score: float


class SearchResponse(BaseModel):
    success: bool
    query: str
    count: int
    results: list[SearchResult]