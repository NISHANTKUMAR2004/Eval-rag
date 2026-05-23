import google.generativeai as genai
from app.core.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

try:
    print("Listing supported models for generateContent:")
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(f"- {m.name} ({m.display_name})")
except Exception as e:
    import traceback
    traceback.print_exc()
