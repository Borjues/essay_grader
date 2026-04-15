import os
import importlib
import sys

import pytest


def test_routes_to_embedding_and_preserves_contract(monkeypatch, tmp_path):
    # Ensure we import fresh
    if 'uploaditin_backend.utils.scorer_interface' in sys.modules:
        importlib.reload(importlib.import_module('uploaditin_backend.utils.scorer_interface'))

    # Prepare a deterministic return value from embedding scorer
    expected = {
        "avg_similarity": 0.42,
        "grade": 42,
        "per_question": [{"question": 1, "similarity": 0.42, "grade": 42}]
    }

    def fake_embedding_score_submission(ref, stu):
        assert isinstance(ref, str)
        assert isinstance(stu, str)
        return expected

    # Monkeypatch embedding_scorer in utils package
    import uploaditin_backend.utils.embedding_scorer as es_mod
    monkeypatch.setattr(es_mod, 'embedding_score_submission', fake_embedding_score_submission)

    # Set env to use embeddings
    monkeypatch.setenv('SCORING_ENGINE', 'embeddings')

    from uploaditin_backend.utils.scorer_interface import score_submission

    out = score_submission('ref text', 'stu text')

    assert out == expected


def test_embedding_exception_bubbles_as_runtimeerror(monkeypatch):
    # Make embedding scorer raise
    def bad(ref, stu):
        raise ValueError("something went wrong in embeddings")

    import uploaditin_backend.utils.embedding_scorer as es_mod
    monkeypatch.setattr(es_mod, 'embedding_score_submission', bad)
    monkeypatch.setenv('SCORING_ENGINE', 'embeddings')

    from uploaditin_backend.utils.scorer_interface import score_submission

    from uploaditin_backend.utils.scorer_interface import EmbeddingInternalError

    with pytest.raises(EmbeddingInternalError) as ei:
        score_submission('a', 'b')

    # Ensure the wrapped message mentions embedding/internal error for clarity
    assert 'Embedding scorer internal error' in str(ei.value)
