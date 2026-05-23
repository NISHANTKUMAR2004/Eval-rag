from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.chunk import DocumentChunk
from app.db.models.document import Document, DocumentStatus
from app.db.models.project import Project
from app.db.models.user import User
from app.services.embedding_service import embedding_service


class ChunkService:
    CHUNK_SIZE_WORDS = 500  # Increased from 120 for better context
    CHUNK_OVERLAP_WORDS = 80  # Increased from 30 for better continuity

    def get_project_for_user(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ) -> Project | None:
        return (
            db.query(Project)
            .filter(
                Project.id == project_id,
                Project.owner_id == current_user.id,
                Project.is_deleted.is_(False),
            )
            .first()
        )

    def get_document_for_user(
        self,
        db: Session,
        project_id: UUID,
        document_id: UUID,
        current_user: User,
    ) -> Document | None:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            return None

        return (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.project_id == project.id,
                Document.is_deleted.is_(False),
            )
            .first()
        )

    def split_text_into_chunks(self, text: str) -> list[str]:
        words = text.split()

        if not words:
            return []

        chunks: list[str] = []
        start = 0

        while start < len(words):
            end = start + self.CHUNK_SIZE_WORDS
            chunk_words = words[start:end]
            chunks.append(" ".join(chunk_words))

            if end >= len(words):
                break

            start = end - self.CHUNK_OVERLAP_WORDS

        return chunks

    def process_document(
        self,
        db: Session,
        project_id: UUID,
        document_id: UUID,
        current_user: User,
    ) -> int:
        document = self.get_document_for_user(
            db,
            project_id,
            document_id,
            current_user,
        )

        if not document:
            raise ValueError("Document not found")

        if not document.extracted_text:
            raise ValueError("Document has no extracted text to process")

        db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document.id,
        ).delete()

        chunks = self.split_text_into_chunks(document.extracted_text)

        for index, content in enumerate(chunks):
            embedding = embedding_service.embed_text(content)

            chunk = DocumentChunk(
                document_id=document.id,
                project_id=project_id,
                chunk_index=index,
                content=content,
                token_count=len(content.split()),
                embedding=embedding,
            )

            db.add(chunk)

        document.status = DocumentStatus.PROCESSED

        db.commit()

        return len(chunks)

    def list_chunks(
        self,
        db: Session,
        project_id: UUID,
        document_id: UUID,
        current_user: User,
    ) -> list[DocumentChunk]:
        document = self.get_document_for_user(
            db,
            project_id,
            document_id,
            current_user,
        )

        if not document:
            raise ValueError("Document not found")

        return (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document.id)
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )


chunk_service = ChunkService()