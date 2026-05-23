class LLMService:
    def generate_answer(
        self,
        question: str,
        retrieved_contexts: list[str],
    ) -> str:
        """
        Placeholder LLM service.
        Later replace this with OpenAI/Gemini/local LLM.
        """

        if not retrieved_contexts:
            return (
                "I could not find enough relevant context in the uploaded documents "
                "to answer this question."
            )

        combined_context = " ".join(retrieved_contexts)

        short_context = combined_context[:700]

        return (
            "Based on the retrieved project documents, the answer is: "
            f"{short_context}"
        )


llm_service = LLMService()