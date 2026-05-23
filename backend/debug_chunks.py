import sys
import os

# Adjust path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models.document import Document
from app.db.models.chunk import DocumentChunk
from app.db.models.project import Project

db = SessionLocal()

try:
    print("Database Document Diagnostics:")
    
    # List all documents
    documents = db.query(Document).filter(Document.is_deleted.is_(False)).all()
    if not documents:
        print("No documents found in database.")
        sys.exit(0)

    for doc in documents:
        # Get parent project
        proj = db.query(Project).filter(Project.id == doc.project_id).first()
        proj_name = proj.name if proj else "Unknown Project"
        
        # Count chunks
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
        
        # Check text length
        text_len = len(doc.extracted_text) if doc.extracted_text else 0
        
        print(f"\nDocument: {doc.original_filename}")
        print(f"  - Project: {proj_name} ({doc.project_id})")
        print(f"  - Status: {doc.status}")
        print(f"  - File Type: {doc.file_type}")
        print(f"  - File Size: {doc.file_size_bytes} bytes")
        print(f"  - Extracted Text Length: {text_len} characters")
        print(f"  - Chunks Generated: {chunk_count}")
        if doc.error_message:
            print(f"  - Error Message: {doc.error_message}")
            
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
