import sys
import os

# Adjust path to include the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings
from app.services.gemini_service import gemini_service

settings = get_settings()
print(f"Loaded Settings. Model: {settings.GEMINI_MODEL}")
print(f"API Key present: {bool(settings.GEMINI_API_KEY)}")
print(f"API Key prefix: {settings.GEMINI_API_KEY[:8]}...")

try:
    print("Testing Gemini generation...")
    answer = gemini_service.generate_answer(
        question="What is the technology stipend?",
        context="[From Acme - Chunk 0]\nRemote employees are entitled to a technology stipend of exactly $1,250 annually."
    )
    print("Generation successful!")
    print(f"Answer: {answer}")
except Exception as e:
    print("Generation failed!")
    import traceback
    traceback.print_exc()
