import os
from typing import Any


# Exceptions used to signal deterministic embedding-related failures
class EmbeddingProviderError(Exception):
    """Raised when the external embedding provider is unavailable or returns an error."""


class EmbeddingInternalError(Exception):
    """Raised when the embedding scorer implementation fails due to internal errors."""
# Scoring interface abstraction
# Routes scoring calls to the selected scoring engine (legacy | embeddings)
# TODO: implement embeddings-based scorer

def score_submission(reference_text: str, student_text: str) -> dict[str, Any]:
    """Score a student submission against reference text.

    Returns a dict with keys:
      - avg_similarity: float
      - grade: int
      - per_question: list of {question: str, similarity: float, grade: int}

    Behavior:
      - When SCORING_ENGINE env var is 'legacy' (default) delegate to existing LSA implementation
      - When 'embeddings' raise NotImplementedError as a placeholder

    Note: keep LSA implementation untouched; import and reuse its public functions.
    """
    engine = os.getenv("SCORING_ENGINE", "legacy")
    engine = engine.lower() if engine else "legacy"

    if engine == "embeddings":
        # Route to embeddings-based scorer. Import lazily so legacy imports remain lightweight.
        try:
            from . import embedding_scorer
        except ImportError as e:
            # Fail fast when embeddings module missing and embeddings selected
            raise ImportError(
                "SCORING_ENGINE=embeddings but embedding_scorer module is not available. Ensure uploaditin_backend/utils/embedding_scorer.py is present and importable."
            ) from e

        try:
            # embedding_score_submission is expected to return the same dict shape as legacy
            return embedding_scorer.embedding_score_submission(reference_text, student_text)
        except EmbeddingProviderError:
            # Bubble provider availability issues as-is so callers can map to 502
            raise
        except Exception as e:
            # Wrap unexpected errors from the embedding scorer implementation so callers
            # can deterministically distinguish provider availability (502) vs internal (500)
            raise EmbeddingInternalError(f"Embedding scorer internal error: {e}") from e

    # Default/legacy path: delegate to utils.LSA
    # Import lazily to avoid heavy imports at module import time
    # use relative import to work when package imported as uploaditin_backend.utils
    from .LSA import lsa_similarity, extract_answers

    avg_similarity, grade = lsa_similarity(reference_text, student_text)

    # Build per-question breakdown by scoring each question individually
    per_question = []
    model_answers = extract_answers(reference_text)
    student_answers = extract_answers(student_text)

    for qnum, model_ans in model_answers.items():
        siswa_ans = student_answers.get(qnum, "")
        # Call lsa_similarity on single-question texts to get per-question sim
        q_ref = f"jawaban {qnum} = {model_ans}"
        q_stu = f"jawaban {qnum} = {siswa_ans}"
        q_avg, q_grade = lsa_similarity(q_ref, q_stu)
        per_question.append({"question": qnum, "similarity": float(q_avg), "grade": int(q_grade)})

    return {"avg_similarity": float(avg_similarity), "grade": int(grade), "per_question": per_question}
