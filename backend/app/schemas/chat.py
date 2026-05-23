from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class SourceItem(BaseModel):
    """Source chunk information for a chat message."""

    chunk_id: str
    document_id: str
    document_name: str | None = None
    chunk_index: int
    content_preview: str
    score: float | None = None

    class Config:
        from_attributes = True


class ChatMessageRead(BaseModel):
    """Chat message response."""

    id: UUID
    session_id: UUID
    project_id: UUID
    role: str
    content: str
    sources: list[SourceItem] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionRead(BaseModel):
    """Chat session response."""

    id: UUID
    project_id: UUID
    user_id: UUID
    title: str | None = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    """Create chat session request."""

    title: str | None = None


class ChatAskRequest(BaseModel):
    """User's question request."""

    question: str = Field(..., min_length=1, max_length=2000)
    session_id: UUID | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class ChatAskResponse(BaseModel):
    """Response with answer and sources."""

    session_id: UUID
    project_id: UUID
    user_message_id: UUID | None = None
    assistant_message_id: UUID | None = None
    question: str
    answer: str
    sources: list[SourceItem] = []
    created_at: datetime | None = None

    class Config:
        from_attributes = True
