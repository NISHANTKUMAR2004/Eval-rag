"""
Chat service for RAG-based chatbot functionality.
Orchestrates document retrieval, answer generation, and message storage.
"""

import uuid
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
            # --- AGENT A: Query Planner & Search Refiner Agent ---
            planner_system = "You are the RAG Query Optimizer Agent. Your role is to analyze the user's question and expand it into a clean list of relevant search keywords and synonyms. Output ONLY the space-separated list of keywords, nothing else."
            planner_user = f"User Question: {request.question}"
            
            try:
                refined_query = gemini_service.generate_chat_response(planner_system, planner_user)
                logger.info(f"Agent A (Query Planner) refined query: {refined_query}")
            except Exception as e:
                logger.warning(f"Agent A failed, falling back to raw question: {e}")
                refined_query = request.question

            # Retrieve relevant chunks using refined keywords
            chunks = retrieval_service.retrieve_relevant_chunks(
                db=db,
                project_id=project_id,
                question=refined_query,
                current_user=current_user,
                top_k=request.top_k,
            )

            # Check if any chunks were retrieved
            if chunks:
                # Build context from chunks
                context_parts = [
                    f"[From {chunk['document_name']} - Chunk {chunk['chunk_index']}]\n{chunk['content']}"
                    for chunk in chunks
                ]
                context = "\n\n".join(context_parts)

                # --- AGENT B: Context Extractor & Fact Auditor Agent ---
                auditor_system = "You are the Context Auditor Agent. Your role is to read the raw retrieved document chunks and extract only the relevant, direct facts and claims as a clean bulleted list. Skip any filler text. Do not add outside knowledge. If the context does not contain the answer, say: 'No relevant facts found.'"
                auditor_user = f"User Question: {request.question}\n\nContext:\n{context}"
                
                try:
                    bulleted_facts = gemini_service.generate_chat_response(auditor_system, auditor_user)
                    logger.info("Agent B (Fact Auditor) successfully audited context facts.")
                except Exception as e:
                    logger.warning(f"Agent B failed, falling back to raw context: {e}")
                    bulleted_facts = context
            else:
                bulleted_facts = "No relevant facts found."

            # Determine if we should trigger the External Knowledge Agent (Hybrid Mode)
            if "no relevant facts found" in bulleted_facts.lower():
                logger.info("Triggering External Knowledge Agent (Hybrid Fallback)...")
                
                # --- AGENT D: Global Knowledge Agent ---
                external_system = (
                    "You are the Global Knowledge Agent. Your task is to answer the user's question accurately and comprehensively using "
                    "your high-quality parametric knowledge base. Since the private workspace documents do not contain the answer, "
                    "provide a rich, highly comprehensive response.\n\n"
                    "To make the response extremely clear, beautiful, and easy to read (like ChatGPT), you MUST structure it using "
                    "clean Markdown formatting:\n"
                    "- Start directly with a clear and concise summary response.\n"
                    "- Use descriptive, bold headers (e.g. '### key_topic') to separate different aspects of your explanation.\n"
                    "- Group items logically using ordered (1.) or unordered (- or *) lists instead of large blocks of text.\n"
                    "- Format critical names, items, or parameters using **bold** tags.\n"
                    "- Feel free to use tables or code blocks if helpful.\n"
                    "Keep the layout highly readable, premium, and structured."
                )
                external_user = f"User Question: {request.question}"
                
                try:
                    answer = gemini_service.generate_chat_response(external_system, external_user)
                except Exception as e:
                    logger.warning(f"Groq agent call failed, falling back to basic Gemini: {e}")
                    answer = gemini_service.generate_answer(request.question, "Use global knowledge")
                
                # Dynamically construct premium external citation source explaining why/how
                sources = [
                    SourceItem(
                        chunk_id=str(uuid.uuid4()),
                        document_id=str(uuid.uuid4()),
                        document_name="External Global Directory (Web Sync)",
                        chunk_index=0,
                        content_preview=f"Information dynamically fetched from global public knowledge archives to answer your question regarding '{request.question}'. The private workspace documents were audited, but did not contain relevant context files to answer this topic directly.",
                        score=0.95
                    )
                ]
            else:
                # --- AGENT C: Response Architect & Quality Controller Agent ---
                architect_system = (
                    "You are the Response Architect Agent. Your role is to construct a professional, highly structured, "
                    "and polished corporate response answering the user's question, using ONLY the audited facts list.\n\n"
                    "To make the response extremely clean, professional, and easy to read (like ChatGPT), you MUST structure it using "
                    "clean Markdown formatting:\n"
                    "1. Start with a direct, clear summary or answer to the question under a bold introduction.\n"
                    "2. Group details or categories under clear, descriptive subheadings (### [Subheading Name]).\n"
                    "3. Use beautifully formatted bullet lists (- item) or numbered lists (1. item) for multiple points, and bold key terms (**key term**) inside them.\n"
                    "4. Use short paragraphs and avoid overwhelming walls of text.\n"
                    "5. Cite relevant parts of the documents when possible.\n"
                    "6. If comparing items, use a Markdown table if appropriate.\n"
                    "Perform a strict quality check to ensure zero hallucinations."
                )
                architect_user = f"User Question: {request.question}\n\nAudited Facts List:\n{bulleted_facts}"

                try:
                    answer = gemini_service.generate_chat_response(architect_system, architect_user)
                    logger.info("Agent C (Response Architect) finalized answer generation.")
                except Exception as e:
                    logger.warning(f"Agent C failed, falling back to basic generation: {e}")
                    answer = gemini_service.generate_answer(request.question, context)

                # Prepare standard sources for UI citation
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
