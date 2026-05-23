from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.dataset import DatasetStatus


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None


class DatasetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    status: DatasetStatus | None = None


class DatasetRead(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: str | None
    status: DatasetStatus
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DatasetListResponse(BaseModel):
    success: bool
    count: int
    datasets: list[DatasetRead]