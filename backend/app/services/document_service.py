from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session
from pypdf import PdfReader

from app.core.storage import delete_file_if_exists, get_file_extension, save_upload_file
from app.db.models.document import Document, DocumentStatus
from app.db.models.project import Project
from app.db.models.user import User
from app.services.chunk_service import chunk_service
from app.core.logging import logger


class DocumentService:
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

    def extract_text_from_file(self, file_path: str, file_type: str) -> str | None:
        """Extract text from various file types (.txt, .md, .pdf)"""
        path = Path(file_path)

        try:
            if file_type in {".txt", ".md"}:
                return path.read_text(encoding="utf-8", errors="ignore")

            if file_type == ".pdf":
                try:
                    reader = PdfReader(path)
                    text_parts = []

                    for page_num, page in enumerate(reader.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text and page_text.strip():
                                text_parts.append(page_text)
                        except Exception as exc:
                            logger.warning(
                                f"Failed to extract text from page {page_num}: {exc}"
                            )
                            continue

                    if text_parts:
                        return "\n\n".join(text_parts)
                    else:
                        logger.warning(f"No text extracted from PDF: {path}")
                        return None

                except Exception as exc:
                    logger.error(f"PDF extraction error: {exc}")
                    return None

            return None

        except Exception as exc:
            logger.error(f"Text extraction error for {file_path}: {exc}")
            return None

    def upload_document(
        self,
        db: Session,
        project_id: UUID,
        file: UploadFile,
        current_user: User,
    ) -> Document:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        stored_file_path, file_size = save_upload_file(file)
        file_type = get_file_extension(file.filename)

        document = Document(
            project_id=project.id,
            original_filename=file.filename,
            stored_file_path=stored_file_path,
            file_type=file_type,
            file_size_bytes=file_size,
            status=DocumentStatus.UPLOADED,
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        try:
            extracted_text = self.extract_text_from_file(stored_file_path, file_type)

            document.extracted_text = extracted_text

            if extracted_text:
                document.status = DocumentStatus.PROCESSED
                db.commit()
                db.refresh(document)

                chunk_service.process_document(
                    db=db,
                    project_id=project.id,
                    document_id=document.id,
                    current_user=current_user,
                )
            else:
                document.status = DocumentStatus.UPLOADED
                db.commit()
                db.refresh(document)

        except Exception as exc:
            document.status = DocumentStatus.FAILED
            document.error_message = str(exc)
            db.commit()
            db.refresh(document)

        return document

    def list_documents(
        self,
        db: Session,
        project_id: UUID,
        current_user: User,
    ) -> list[Document]:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        return (
            db.query(Document)
            .filter(
                Document.project_id == project.id,
                Document.is_deleted.is_(False),
            )
            .order_by(Document.created_at.desc())
            .all()
        )

    def get_document_by_id(
        self,
        db: Session,
        project_id: UUID,
        document_id: UUID,
        current_user: User,
    ) -> Document | None:
        project = self.get_project_for_user(db, project_id, current_user)

        if not project:
            raise ValueError("Project not found")

        return (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.project_id == project.id,
                Document.is_deleted.is_(False),
            )
            .first()
        )

    def delete_document(
        self,
        db: Session,
        document: Document,
    ) -> None:
        document.is_deleted = True
        delete_file_if_exists(document.stored_file_path)
        db.commit()


document_service = DocumentService()