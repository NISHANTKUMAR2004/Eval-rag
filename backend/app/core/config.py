from functools import lru_cache
from typing import List
from dotenv import load_dotenv

# Force load active .env and override any parent system environment variables
load_dotenv(override=True)

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "EvalGuard AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/evalguard_ai"

    BACKEND_CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000"
    )

    LOG_LEVEL: str = "INFO"

    UPLOAD_DIR: str = "storage/documents"
    MAX_UPLOAD_SIZE_MB: int = 10

    # LLM Provider Configuration ("groq", "gemini")
    LLM_PROVIDER: str = "groq"

    # Gemini API configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Groq API configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()