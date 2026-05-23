import sys
import os
from uuid import UUID

# Adjust path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.project import Project
from app.db.models.document import Document
from app.schemas.chat import ChatAskRequest
from app.services.chat_service import chat_service

db = SessionLocal()

try:
    # Get first user and project to run diagnostic
    user = db.query(User).first()
    if not user:
        print("❌ Error: No user found in database.")
        sys.exit(1)
        
    project_id = UUID("8ea4a62f-5a48-4d35-a0b9-ca15f525637f")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        print("❌ Error: Targeted project 8ea4a62f-5a48-4d35-a0b9-ca15f525637f not found in database.")
        sys.exit(1)

    print(f"Loaded Diagnostic Context:")
    print(f"- User: {user.email}")
    print(f"- Project: {project.name} ({project.id})")

    # Print documents and their chunks status
    documents = db.query(Document).filter(Document.project_id == project.id).all()
    print(f"- Project Documents ({len(documents)}):")
    for doc in documents:
        print(f"  * {doc.original_filename} - Status: {doc.status}")

    # Build request
    req = ChatAskRequest(
        question="What is the technology stipend for remote employees?",
        session_id=None, # Fresh session
        top_k=3
    )

    print("\nExecuting chat_service.ask_question in context...")
    response = chat_service.ask_question(
        db=db,
        project_id=project.id,
        request=req,
        current_user=user
    )
    print("🎉 API CALL SUCCESSFUL!")
    print(f"Answer: {response.answer}")

except Exception as e:
    print("\nEXECUTION CRASHED!")
    import traceback
    traceback.print_exc()
finally:
    db.close()
