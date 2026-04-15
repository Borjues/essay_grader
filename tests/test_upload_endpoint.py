import io
import json
import pytest

import uploaditin_backend.app as app_module


def _make_file_tuple(tmp_file):
    bio, name = tmp_file
    bio.seek(0)
    return (name, bio, 'application/pdf')


def test_happy_path(client, tmp_file, make_fake_db, patch_upload_and_download, patch_extract_text_and_score, capture_simpan):
    # Prepare DB to return kelas_id, jawaban_path, judul when selecting assignment
    make_fake_db([(1, 'https://supabase.test/storage/v1/object/public/uploads/answers/teacher/guru.pdf', 'Soal 1')])

    data = {
        'file': (tmp_file[0], tmp_file[1])
    }

    # Flask test client expects file tuple as (fileobj, filename)
    file_obj = io.BytesIO(b"dummy content")
    file_obj.name = 'student_submission.pdf'

    rv = client.post('/api/assignments/upload/123', data={
        'file': (file_obj, 'student_submission.pdf')
    }, content_type='multipart/form-data')

    assert rv.status_code == 200
    body = rv.get_json()
    assert body['success'] is True
    # simpan_ke_postgres should have been called once with list containing dict
    assert len(capture_simpan['args']) == 1
    saved = capture_simpan['args'][0]
    assert isinstance(saved, list) and len(saved) == 1
    item = saved[0]
    for key in ['name', 'similarity', 'grade', 'user_id', 'kelas_id', 'assignment_id', 'file_path']:
        assert key in item


def test_storage_download_failure(client, tmp_file, make_fake_db, patch_upload_and_download, patch_extract_text_and_score, monkeypatch):
    make_fake_db([(1, 'https://supabase.test/storage/v1/object/public/uploads/answers/teacher/guru.pdf', 'Soal 1')])

    # make download_file raise SupabaseDownloadError when downloading guru file
    # Use the SupabaseDownloadError exposed on the app module to avoid import path issues in tests
    SupabaseDownloadError = app_module.SupabaseDownloadError

    def bad_download(url, client=None, bucket='uploads'):
        raise SupabaseDownloadError('download failed')

    monkeypatch.setattr(app_module, 'download_file', bad_download)

    file_obj = io.BytesIO(b"dummy content")
    file_obj.name = 'student_submission.pdf'

    rv = client.post('/api/assignments/upload/123', data={
        'file': (file_obj, 'student_submission.pdf')
    }, content_type='multipart/form-data')

    assert rv.status_code == 500
    body = rv.get_json()
    assert 'Gagal mendownload' in body.get('error', '') or 'download' in body.get('error', '').lower()


def test_scorer_failure_returns_500(client, tmp_file, make_fake_db, patch_upload_and_download, patch_extract_text_and_score, monkeypatch, capture_simpan):
    make_fake_db([(1, 'https://supabase.test/storage/v1/object/public/uploads/answers/teacher/guru.pdf', 'Soal 1')])

    def bad_score(ref, stu):
        raise RuntimeError('scorer failed')

    monkeypatch.setattr(app_module, 'score_submission', bad_score)

    file_obj = io.BytesIO(b"dummy content")
    file_obj.name = 'student_submission.pdf'

    rv = client.post('/api/assignments/upload/123', data={
        'file': (file_obj, 'student_submission.pdf')
    }, content_type='multipart/form-data')

    assert rv.status_code == 500
    # On scorer failure the endpoint should return 500; ensure nothing was saved to DB
    # The response body may be HTML from Flask error handler, so avoid json parsing
    assert len(capture_simpan['args']) == 0


def test_upload_provider_failure(client, tmp_file, make_fake_db, patch_upload_and_download, patch_extract_text_and_score, monkeypatch, capture_simpan):
    """Simulate embedding provider being unavailable and ensure endpoint returns deterministic 502 JSON."""
    make_fake_db([(1, 'https://supabase.test/storage/v1/object/public/uploads/answers/teacher/guru.pdf', 'Soal 1')])

    # Import the provider error from scorer_interface via app_module to keep import paths consistent
    ProviderError = app_module.EmbeddingProviderError

    def provider_down(ref, stu):
        raise ProviderError('provider not reachable')

    monkeypatch.setattr(app_module, 'score_submission', provider_down)

    file_obj = io.BytesIO(b"dummy content")
    file_obj.name = 'student_submission.pdf'

    rv = client.post('/api/assignments/upload/123', data={
        'file': (file_obj, 'student_submission.pdf')
    }, content_type='multipart/form-data')

    assert rv.status_code == 502
    body = rv.get_json()
    assert body == {"success": False, "error": "Embedding provider unavailable"}
    # Ensure nothing was saved to DB
    assert len(capture_simpan['args']) == 0


def test_db_save_failure_returns_500(client, tmp_file, make_fake_db, patch_upload_and_download, patch_extract_text_and_score, capture_simpan):
    make_fake_db([(1, 'https://supabase.test/storage/v1/object/public/uploads/answers/teacher/guru.pdf', 'Soal 1')])
    # instruct capture_simpan to raise
    capture_simpan['raise'] = True

    file_obj = io.BytesIO(b"dummy content")
    file_obj.name = 'student_submission.pdf'

    rv = client.post('/api/assignments/upload/123', data={
        'file': (file_obj, 'student_submission.pdf')
    }, content_type='multipart/form-data')

    assert rv.status_code == 500
    body = rv.get_json()
    assert 'Gagal menyimpan' in body.get('error', '') or 'gagal' in body.get('error', '').lower()
