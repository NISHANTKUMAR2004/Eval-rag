from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.chunk import (
    ChunkListResponse,
    ProcessDocumentResponse,
    SearchRequest,
    SearchResponse,
)
from app.services.chunk_service import chunk_service
from app.services.search_service import search_service

router = APIRouter(tags=["Chunks & Search"])


@router.post(
    "/projects/{project_id}/documents/{document_id}/process",
    response_model=ProcessDocumentResponse,
)
def process_document(
    project_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        chunks_created = chunk_service.process_document(
            db,
            project_id,
            document_id,
            current_user,
        )

        return ProcessDocumentResponse(
            success=True,
            document_id=document_id,
            chunks_created=chunks_created,
            message="Document processed into chunks successfully",
        )

    except ValueError as exc:
        message = str(exc)

        status_code = (
            status.HTTP_404_NOT_FOUND
            if message == "Document not found"
            else status.HTTP_400_BAD_REQUEST
        )

        raise HTTPException(
            status_code=status_code,
            detail=message,
        ) from exc


@router.get(
    "/projects/{project_id}/documents/{document_id}/chunks",
    response_model=ChunkListResponse,
)
def list_chunks(
    project_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        chunks = chunk_service.list_chunks(
            db,
            project_id,
            document_id,
            current_user,
        )

        return ChunkListResponse(
            success=True,
            count=len(chunks),
            chunks=chunks,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/projects/{project_id}/search",
    response_model=SearchResponse,
)
def search_project(
    project_id: UUID,
    payload: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        results = search_service.search_project(
            db,
            project_id,
            payload.query,
            payload.top_k,
            current_user,
        )

        return SearchResponse(
            success=True,
            query=payload.query,
            count=len(results),
            results=results,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc