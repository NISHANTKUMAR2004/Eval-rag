import os
import httpx
from dotenv import load_dotenv

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {groq_api_key}",
    "Content-Type": "application/json",
}

payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "user", "content": "Hello! Reply with 'OK' if you can read this."}
    ],
    "temperature": 0.2,
}

try:
    print("Testing direct Groq Chat Completion...")
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=15.0
    )
    print(f"Status Code: {response.status_code}")
    print("Response text:")
    print(response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
