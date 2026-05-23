import sys
import os
import uuid
from uuid import UUID

# Adjust path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models.document import Document
from app.db.models.chunk import DocumentChunk
from app.db.models.project import Project

db = SessionLocal()

try:
    print("Initiating Database RAG Transfer...")
    
    src_project_id = UUID("4171189e-64fb-432b-8657-1e99fdc9a02a")  # polity
    dest_project_id = UUID("8ea4a62f-5a48-4d35-a0b9-ca15f525637f") # Acme Compliance Audit

    # Find the source Workbook.pdf
    src_doc = db.query(Document).filter(
        Document.project_id == src_project_id,
        Document.original_filename == "Workbook.pdf",
        Document.is_deleted.is_(False)
    ).first()

    if not src_doc:
        print("❌ Error: Could not find Workbook.pdf in the source 'polity' project database.")
        sys.exit(1)

    print(f"Found source document: {src_doc.original_filename} (Extracted length: {len(src_doc.extracted_text)} chars)")

    # Check if Workbook.pdf already exists in target project
    dest_doc = db.query(Document).filter(
        Document.project_id == dest_project_id,
        Document.original_filename == "Workbook.pdf",
        Document.is_deleted.is_(False)
    ).first()

    if dest_doc:
        print(f"Workbook.pdf already exists in 'Acme Compliance Audit' (ID: {dest_doc.id}). Re-migrating chunks...")
        # Delete existing chunks to prevent duplicates
        db.query(DocumentChunk).filter(DocumentChunk.document_id == dest_doc.id).delete()
        db.delete(dest_doc)
        db.commit()

    # Create new document record in target project
    new_doc_id = uuid.uuid4()
    new_doc = Document(
        id=new_doc_id,
        project_id=dest_project_id,
        original_filename=src_doc.original_filename,
        stored_file_path=src_doc.stored_file_path,
        file_type=src_doc.file_type,
        file_size_bytes=src_doc.file_size_bytes,
        extracted_text=src_doc.extracted_text,
        status=src_doc.status
    )
    db.add(new_doc)
    db.commit()
    print(f"Created new document record in 'Acme Compliance Audit' project (New ID: {new_doc.id})")

    # Fetch and copy all chunks
    old_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == src_doc.id).all()
    print(f"Copying {len(old_chunks)} semantic database chunks...")

    chunk_objects = []
    for old_chunk in old_chunks:
        new_chunk = DocumentChunk(
            id=uuid.uuid4(),
            document_id=new_doc.id,
            project_id=dest_project_id,
            chunk_index=old_chunk.chunk_index,
            content=old_chunk.content,
            token_count=old_chunk.token_count,
            embedding=old_chunk.embedding
        )
        chunk_objects.append(new_chunk)

    # Bulk insert for speed
    db.bulk_save_objects(chunk_objects)
    db.commit()
    
    # Verify chunk count
    copied_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == new_doc.id).count()
    print(f"SUCCESS: Copied Workbook.pdf and {copied_chunks} chunks successfully to Acme Compliance Audit workspace!")

except Exception as e:
    print("Database migration failed!")
    import traceback
    traceback.print_exc()
finally:
    db.close()
