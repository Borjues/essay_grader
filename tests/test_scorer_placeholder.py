import os
from uploaditin_backend.utils import scorer_interface


def test_score_submission_interface_exists():
    assert hasattr(scorer_interface, 'score_submission')


def test_legacy_routing_returns_keys():
    # Ensure default routing (no SCORING_ENGINE set) uses legacy path
    os.environ.pop('SCORING_ENGINE', None)
    ref = "jawaban 1 = ini adalah jawaban guru\n"
    stu = "jawaban 1 = ini adalah jawaban murid\n"
    res = scorer_interface.score_submission(ref, stu)
    assert isinstance(res, dict)
    assert 'avg_similarity' in res
    assert 'grade' in res
    assert 'per_question' in res
