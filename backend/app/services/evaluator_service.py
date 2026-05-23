import re


class EvaluatorService:
    def _normalize_words(self, text: str) -> set[str]:
        words = re.findall(r"[a-zA-Z0-9]+", text.lower())
        stop_words = {
            "the",
            "is",
            "a",
            "an",
            "and",
            "or",
            "to",
            "of",
            "in",
            "for",
            "by",
            "with",
            "on",
            "this",
            "that",
            "it",
            "as",
            "are",
            "be",
            "from",
        }

        return {word for word in words if word not in stop_words}

    def _jaccard_similarity(self, text_a: str, text_b: str) -> float:
        words_a = self._normalize_words(text_a)
        words_b = self._normalize_words(text_b)

        if not words_a or not words_b:
            return 0.0

        intersection = len(words_a.intersection(words_b))
        union = len(words_a.union(words_b))

        return intersection / union

    def score_answer_relevance(
        self,
        question: str,
        expected_answer: str,
        generated_answer: str,
    ) -> float:
        expected_similarity = self._jaccard_similarity(
            expected_answer,
            generated_answer,
        )

        question_similarity = self._jaccard_similarity(
            question,
            generated_answer,
        )

        score = (expected_similarity * 0.75) + (question_similarity * 0.25)

        return round(min(score, 1.0), 4)

    def score_faithfulness(
        self,
        generated_answer: str,
        retrieved_contexts: list[str],
    ) -> float:
        if not retrieved_contexts:
            return 0.0

        combined_context = " ".join(retrieved_contexts)

        score = self._jaccard_similarity(generated_answer, combined_context)

        return round(min(score, 1.0), 4)

    def score_context_precision(
        self,
        question: str,
        retrieved_contexts: list[str],
    ) -> float:
        if not retrieved_contexts:
            return 0.0

        context_scores = [
            self._jaccard_similarity(question, context)
            for context in retrieved_contexts
        ]

        score = sum(context_scores) / len(context_scores)

        return round(min(score, 1.0), 4)

    def build_explanation(
        self,
        faithfulness_score: float,
        answer_relevance_score: float,
        context_precision_score: float,
        overall_score: float,
    ) -> str:
        return (
            "Evaluation completed using deterministic lexical similarity scoring. "
            f"Faithfulness={faithfulness_score}, "
            f"Answer relevance={answer_relevance_score}, "
            f"Context precision={context_precision_score}, "
            f"Overall={overall_score}."
        )


evaluator_service = EvaluatorService()