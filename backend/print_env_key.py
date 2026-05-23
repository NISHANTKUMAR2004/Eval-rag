import os
import sys

# Adjust path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings

settings = get_settings()
env_key = os.environ.get("GROQ_API_KEY")
settings_key = settings.GROQ_API_KEY

print("Environment Variables Diagnostics:")
print(f"- OS environment key: {env_key[:20]}..." if env_key else "- OS environment key: None")
print(f"- Settings loaded key: {settings_key[:20]}..." if settings_key else "- Settings loaded key: None")
print(f"Are they identical? {env_key == settings_key}")
