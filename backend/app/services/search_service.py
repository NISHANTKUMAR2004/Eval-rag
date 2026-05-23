from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.chunk import DocumentChunk
from app.db.models.project import Project
from app.db.models.user import User
from app.schemas.chunk import SearchResult
from app.services.embedding_service import embedding_service


class SearchService:
    def search_project(
        self,
        db: Session,
        project_id: UUID,
        query: str,
        top_k: int,
        current_user: User,
    ) -> list[SearchResult]:
        project = (
            db.query(Project)
            .filter(
                Project.id == project_id,
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
            )
            .first()
        )

        if not project:
            raise ValueError("Project not found")

        query_embedding = embedding_service.embed_text(query)

        chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.project_id == project.id)
            .all()
        )

        results: list[SearchResult] = []

        for chunk in chunks:
            score = embedding_service.cosine_similarity(
                query_embedding,
                chunk.embedding or [],
            )

            if query.lower() in chunk.content.lower():
                score += 0.25

            results.append(
                SearchResult(
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    project_id=chunk.project_id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    score=round(score, 4),
                )
            )

        results.sort(key=lambda item: item.score, reverse=True)

        return results[:top_k]


search_service = SearchService()