"""
Chat service for RAG-based chatbot functionality.
Orchestrates document retrieval, answer generation, and message storage.
"""

from uuid import UUID
from sqlalchemy.orm import Session

from app.db.models.chat import ChatSession, ChatMessage, ChatSessionRole
from app.db.models.project import Project
from app.db.models.user import User
from app.schemas.chat import (
    ChatAskRequest,
    ChatAskResponse,
    SourceItem,
    ChatSessionCreate,
    ChatSessionRead,
    ChatMessageRead,
)
from app.services.retrieval_service import retrieval_service
from app.services.gemini_service import gemini_service
from app.core.logging import logger


class ChatService:
    """Service for managing chat interactions."""

    def get_project_for_user(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ) -> Project | None:
        """Get project if user owns it."""
        return (
            db.query(Project)
            .filter(
                Project.id == project_id,
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
            )
            .first()
        )

    def create_or_get_session(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
        session_id: UUID | None = None,
    ) -> ChatSession:
        """Create new session or return existing one."""
        if session_id:
            session = (
                db.query(ChatSession)
                .filter(
                    ChatSession.id == session_id,
                    ChatSession.project_id == project_id,
                    ChatSession.user_id == current_user.id,
                    ChatSession.is_deleted.is_(False),
                )
                .first()
            )
            if session:
                return session

        # Create new session
        new_session = ChatSession(
            project_id=project_id,
            user_id=current_user.id,
            title=None,  # Auto-generate later if needed
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

    def ask_question(
        self,
        db: Session,
        project_id: UUID,
        request: ChatAskRequest,
        current_user: User,
    ) -> ChatAskResponse:
        """
        Process a user question and generate an answer using RAG.

        Flow:
        1. Validate project exists
        2. Create/get chat session
        3. Store user message
        4. Retrieve relevant chunks
        5. Build context from chunks
        6. Generate answer using Gemini
        7. Store assistant message with sources
        8. Return response

        Raises:
            ValueError: If project not found or no documents available
        """
        project = self.get_project_for_user(db, project_id, current_user)
        if not project:
            raise ValueError("Project not found")

        # Create or get session
        session = self.create_or_get_session(
            db, project_id, current_user, request.session_id
        )

        # Store user message
        user_message = ChatMessage(
            session_id=session.id,
            project_id=project_id,
            user_id=current_user.id,
            role=ChatSessionRole.USER,
            content=request.question,
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        try:
            # Retrieve relevant chunks
            chunks = retrieval_service.retrieve_relevant_chunks(
                db=db,
                project_id=project_id,
                question=request.question,
                current_user=current_user,
                top_k=request.top_k,
            )

            if not chunks:
                raise ValueError(
                    "No processed documents found in this project. "
                    "Please upload and process documents before asking questions."
                )

            # Build context from chunks
            context_parts = [
                f"[From {chunk['document_name']} - Chunk {chunk['chunk_index']}]\n{chunk['content']}"
                for chunk in chunks
            ]
            context = "\n\n".join(context_parts)

            # Generate answer using Gemini
            answer = gemini_service.generate_answer(
                question=request.question,
                context=context,
            )

            # Prepare sources
            sources = [
                SourceItem(
                    chunk_id=chunk["chunk_id"],
                    document_id=chunk["document_id"],
                    document_name=chunk["document_name"],
                    chunk_index=chunk["chunk_index"],
                    content_preview=chunk["content"][:200] + "..."
                    if len(chunk["content"]) > 200
                    else chunk["content"],
                    score=chunk["score"],
                )
                for chunk in chunks
            ]

            # Store assistant message with sources
            sources_json = [s.model_dump() for s in sources] if sources else None

            assistant_message = ChatMessage(
                session_id=session.id,
                project_id=project_id,
                user_id=current_user.id,
                role=ChatSessionRole.ASSISTANT,
                content=answer,
                sources=sources_json,
            )
            db.add(assistant_message)
            db.commit()
            db.refresh(assistant_message)

            return ChatAskResponse(
                session_id=session.id,
                project_id=project_id,
                user_message_id=user_message.id,
                assistant_message_id=assistant_message.id,
                question=request.question,
                answer=answer,
                sources=sources,
                created_at=assistant_message.created_at,
            )

        except Exception as exc:
            logger.error(f"Chat error: {str(exc)}")
            # Clean up if generation fails
            db.delete(user_message)
            db.commit()
            raise

    def list_sessions(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ) -> list[ChatSessionRead]:
        """List all chat sessions for a project."""
        project = self.get_project_for_user(db, project_id, current_user)
        if not project:
            raise ValueError("Project not found")

        sessions = (
            db.query(ChatSession)
            .filter(
                ChatSession.project_id == project_id,
                ChatSession.user_id == current_user.id,
                ChatSession.is_deleted.is_(False),
            )
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

        return [ChatSessionRead.model_validate(s) for s in sessions]

    def get_session_messages(
        self,
        db: Session,
        project_id: UUID,
        session_id: UUID,
        current_user: User,
    ) -> list[ChatMessageRead]:
        """Get all messages in a chat session."""
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == session_id,
                ChatSession.project_id == project_id,
                ChatSession.user_id == current_user.id,
                ChatSession.is_deleted.is_(False),
            )
            .first()
        )

        if not session:
            raise ValueError("Chat session not found")

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

        return [ChatMessageRead.model_validate(m) for m in messages]

    def delete_session(
        self,
        db: Session,
        project_id: UUID,
        session_id: UUID,
        current_user: User,
    ) -> bool:
        """Soft delete a chat session."""
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == session_id,
                ChatSession.project_id == project_id,
                ChatSession.user_id == current_user.id,
                ChatSession.is_deleted.is_(False),
            )
            .first()
        )

        if not session:
            raise ValueError("Chat session not found")

        session.is_deleted = True
        db.commit()
        return True


# Singleton instance
chat_service = ChatService()
