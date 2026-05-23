"""
LLM Generation service for RAG-based answer generation.
Supports Groq (Llama) and Google Gemini model providers.
"""

import google.generativeai as genai
import httpx
from app.core.config import get_settings
from app.core.logging import logger


class GeminiService:
    def __init__(self):
        self.settings = get_settings()
        self.provider = self.settings.LLM_PROVIDER.lower()
        self.api_key = self.settings.GEMINI_API_KEY.strip() if self.settings.GEMINI_API_KEY else ""
        self.model_name = self.settings.GEMINI_MODEL
        self.groq_api_key = self.settings.GROQ_API_KEY.strip() if self.settings.GROQ_API_KEY else ""
        self.groq_model = self.settings.GROQ_MODEL

        # Configure Gemini in background if key is present
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(self.model_name)
            except Exception as e:
                logger.warning(f"Failed to configure Gemini: {e}")
                self.client = None
        else:
            self.client = None

    def generate_chat_response(self, system_prompt: str, user_prompt: str) -> str:
        """Helper to run any system+user prompt on the active LLM provider (Groq/Gemini)."""
        if self.provider == "groq":
            if not self.groq_api_key:
                raise ValueError("Groq API key not configured")
            try:
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.2,
                }
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
            except Exception as exc:
                logger.error(f"Groq Agent error: {str(exc)}")
                raise
        else:
            if not self.client:
                raise ValueError("Gemini is not configured")
            try:
                response = self.client.generate_content(
                    [system_prompt, "\n\n", user_prompt],
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=1024,
                    ),
                )
                return response.text.strip()
            except Exception as exc:
                logger.error(f"Gemini Agent error: {str(exc)}")
                raise

    def generate_answer(self, question: str, context: str) -> str:
        """
        Generate an answer to a question based on provided document context.
        Uses Groq if configured, otherwise falls back to Gemini.
        """
        if not context or not context.strip():
            raise ValueError("No document context provided for answer generation.")

        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        system_prompt = """You are EvalGuard AI, a RAG assistant specialized in answering questions about uploaded documents.

INSTRUCTIONS:
- Answer ONLY using the provided document context below.
- If the answer is not present in the context, respond: "I could not find this information in the uploaded documents."
- Keep answers clear, concise, and well-structured.
- Do not hallucinate or make up information not in the context.
- If context is insufficient to answer fully, mention what information is missing.
- Be helpful and professional in tone.
- Cite relevant parts of the documents when possible."""

        user_prompt = f"""Context from uploaded documents:
---
{context}
---

User Question:
{question}

Please provide an answer based only on the context above."""

        # --- 1. HIGH-SPEED GROQ PROVIDER ---
        if self.provider == "groq":
            if not self.groq_api_key:
                raise ValueError("Groq API key is not configured. Please set GROQ_API_KEY in environment.")

            logger.info(f"Generating answer via Groq using {self.groq_model}")
            try:
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.2,
                }
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    response.raise_for_status()
                    data = response.json()
                    answer = data["choices"][0]["message"]["content"]
                    return answer.strip()
            except Exception as exc:
                logger.error(f"Groq API error: {str(exc)}")
                raise ValueError(f"Groq generation failed: {str(exc)}") from exc

        # --- 2. GOOGLE GEMINI PROVIDER (FALLBACK) ---
        else:
            if not self.client:
                raise ValueError(
                    "Gemini API is not configured. Please set GEMINI_API_KEY in environment."
                )

            logger.info(f"Generating answer via Gemini using {self.model_name}")
            try:
                response = self.client.generate_content(
                    [system_prompt, "\n\n", user_prompt],
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=1024,
                    ),
                )

                if not response or not response.text:
                    return "Could not generate a response. Please try again."

                return response.text.strip()

            except Exception as exc:
                logger.error(f"Gemini API error: {str(exc)}")
                raise ValueError(f"Gemini generation failed: {str(exc)}") from exc


# Singleton instance
gemini_service = GeminiService()
