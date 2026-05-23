"""
Retrieval service for finding relevant document chunks based on queries.
Uses keyword-based scoring as a simple but effective retrieval method.
Can be upgraded to vector similarity in the future.
"""

from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.db.models.chunk import DocumentChunk
from app.db.models.document import Document, DocumentStatus
from app.db.models.project import Project
from app.db.models.user import User
from app.core.logging import logger


class RetrievalService:
    """Service for retrieving relevant chunks based on queries."""

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

    def _compute_keyword_relevance(self, query: str, chunk_content: str) -> float:
        """
        Compute relevance score based on keyword overlap.

        Score factors:
        - Exact phrase matches (highest)
        - Word overlap (medium)
        - Query word frequency in chunk (low)
        """
        query_lower = query.lower()
        chunk_lower = chunk_content.lower()

        # Exact phrase match (strongest signal)
        if query_lower in chunk_lower:
            return 1.0

        # Word-based matching
        query_words = set(query_lower.split())
        chunk_words = chunk_lower.split()

        # Remove very common words
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "is", "are", "was", "were", "be", "at", "to", "for", "of", "by", "on", "it", "with"}
        query_words = {w for w in query_words if len(w) > 2 and w not in stop_words}

        if not query_words:
            return 0.0

        # Count matching words
        matches = sum(1 for w in chunk_words if w in query_words)
        overlap_ratio = matches / len(query_words)

        return min(overlap_ratio, 1.0)

    def retrieve_relevant_chunks(
        self,
        db: Session,
        project_id: UUID,
        question: str,
        current_user: User,
        top_k: int = 5,
    ) -> list[dict]:
        """
        Retrieve top-k relevant chunks for a question.

        Returns list of dictionaries containing:
        - chunk_id
        - document_id
        - chunk_index
        - content
        - score (relevance score 0-1)
        - document_name

        Raises:
            ValueError: If project not found
        """
        project = self.get_project_for_user(db, project_id, current_user)
        if not project:
            raise ValueError("Project not found")

        # Get all chunks from processed documents in this project
        chunks = (
            db.query(DocumentChunk)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(
                and_(
                    DocumentChunk.project_id == project_id,
                    Document.status == DocumentStatus.PROCESSED,
                    Document.is_deleted.is_(False),
                )
            )
            .all()
        )

        if not chunks:
            logger.info(f"No processed chunks found for project {project_id}")
            return []

        # Score chunks
        scored_chunks = []
        for chunk in chunks:
            score = self._compute_keyword_relevance(question, chunk.content)

            if score > 0:  # Only include relevant chunks
                document = (
                    db.query(Document)
                    .filter(Document.id == chunk.document_id)
                    .first()
                )

                scored_chunks.append(
                    {
                        "chunk_id": str(chunk.id),
                        "document_id": str(chunk.document_id),
                        "document_name": document.original_filename if document else "Unknown",
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "score": score,
                    }
                )

        # Sort by score (highest first)
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)

        # Return top-k
        return scored_chunks[:top_k]


# Singleton instance
retrieval_service = RetrievalService()
