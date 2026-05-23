import hashlib
import math


class EmbeddingService:
    VECTOR_SIZE = 64

    def embed_text(self, text: str) -> list[float]:
        """
        Deterministic placeholder embedding.
        Later replace this with OpenAI/Gemini/HuggingFace embeddings.
        """
        vector = [0.0] * self.VECTOR_SIZE

        words = text.lower().split()

        for word in words:
            digest = hashlib.sha256(word.encode("utf-8")).hexdigest()
            index = int(digest[:8], 16) % self.VECTOR_SIZE
            vector[index] += 1.0

        return self._normalize(vector)

    def _normalize(self, vector: list[float]) -> list[float]:
        norm = math.sqrt(sum(value * value for value in vector))

        if norm == 0:
            return vector

        return [value / norm for value in vector]

    def cosine_similarity(
        self,
        vector_a: list[float],
        vector_b: list[float],
    ) -> float:
        if not vector_a or not vector_b:
            return 0.0

        return sum(a * b for a, b in zip(vector_a, vector_b))


embedding_service = EmbeddingService()