from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.db.models.document import DocumentStatus


class DocumentRead(BaseModel):
    id: UUID
    project_id: UUID
    original_filename: str
    file_type: str
    file_size_bytes: int
    status: DocumentStatus
    error_message: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailRead(DocumentRead):
    extracted_text: str | None


class DocumentListResponse(BaseModel):
    success: bool
    count: int
    documents: list[DocumentRead]