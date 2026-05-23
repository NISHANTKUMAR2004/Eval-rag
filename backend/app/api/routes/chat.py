from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.chat import (
    ChatAskRequest,
    ChatAskResponse,
    ChatSessionRead,
    ChatMessageRead,
)
from app.services.chat_service import chat_service

router = APIRouter(
    prefix="/projects/{project_id}/chat",
    tags=["Chat"],
)


@router.post("/ask", response_model=ChatAskResponse, status_code=status.HTTP_201_CREATED)
def ask_question(
    project_id: UUID,
    request: ChatAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question about project documents.

    Retrieves relevant chunks and generates an answer using Gemini.
    """
    try:
        response = chat_service.ask_question(
            db=db,
            project_id=project_id,
            request=request,
            current_user=current_user,
        )
        return response

    except ValueError as exc:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in str(exc).lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=status_code,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process your question. Please try again.",
        ) from exc


@router.get("/sessions", response_model=list[ChatSessionRead])
def list_sessions(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat sessions for a project."""
    try:
        sessions = chat_service.list_sessions(
            db=db,
            project_id=project_id,
            current_user=current_user,
        )
        return sessions

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/sessions/{session_id}/messages", response_model=list[ChatMessageRead]
)
def get_session_messages(
    project_id: UUID,
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all messages in a chat session."""
    try:
        messages = chat_service.get_session_messages(
            db=db,
            project_id=project_id,
            session_id=session_id,
            current_user=current_user,
        )
        return messages

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    project_id: UUID,
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a chat session (soft delete)."""
    try:
        chat_service.delete_session(
            db=db,
            project_id=project_id,
            session_id=session_id,
            current_user=current_user,
        )
        return None

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
