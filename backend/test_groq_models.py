import os
import httpx
from dotenv import load_dotenv

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {groq_api_key}",
    "Content-Type": "application/json",
}

try:
    print("Querying Groq Models API...")
    response = httpx.get("https://api.groq.com/openai/v1/models", headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Available models on your Groq key:")
        for model in data.get("data", []):
            print(f"- {model['id']}")
    else:
        print("Failed to query models:")
        print(response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
