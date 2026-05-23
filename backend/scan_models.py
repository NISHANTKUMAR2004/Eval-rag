import sys
import os
import google.generativeai as genai

# Adjust path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

test_models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.5-pro",
]

context = "[From Acme - Chunk 0]\nRemote employees are entitled to a technology stipend of exactly $1,250 annually."
question = "What is the technology stipend?"

system_prompt = "You are a RAG assistant. Answer using context only."
user_prompt = f"Context:\n{context}\n\nQuestion: {question}"

print("Scanning for a model with active quota...")

working_model = None

for model_name in test_models:
    try:
        print(f"\nTrying model: {model_name}...")
        client = genai.GenerativeModel(model_name)
        response = client.generate_content(
            [system_prompt, "\n\n", user_prompt],
        )
        if response and response.text:
            print(f"🎉 SUCCESS with model {model_name}!")
            print(f"Answer: {response.text.strip()}")
            working_model = model_name
            break
    except Exception as e:
        error_msg = str(e)
        if "Quota exceeded" in error_msg or "429" in error_msg:
            print(f"❌ {model_name}: Quota exceeded.")
        elif "404" in error_msg or "not found" in error_msg:
            print(f"❓ {model_name}: Model not found/supported.")
        else:
            print(f"💥 {model_name}: Other error: {error_msg[:120]}")

if working_model:
    print(f"\nRecommended model to set in .env: {working_model}")
else:
    print("\n❌ All models returned quota exceeded or errors. Your Gemini API key free tier might be currently rate-limited or blocked. You may need to create a new API key in Google AI Studio or enable billing.")
