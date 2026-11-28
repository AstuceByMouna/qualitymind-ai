"""QA-127 bounded and sanitized HTTP input tests."""
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def payload(test_case_id):
    return {
        "test_case_id": str(test_case_id),
        "external_run_id": "synthetic-run-1",
        "external_result_id": "synthetic-result-1",
        "script_path": "tests/synthetic.spec.ts",
        "tested_commit_sha": "a" * 40,
        "executed_at": "2026-11-28T08:15:00-05:00",
        "outcome": "PASS",
    }


@pytest.mark.parametrize("overrides", [
    {"test_case_id": "private-marker"},
    {"tested_commit_sha": "private-marker"},
    {"executed_at": "2026-11-28T08:15:00"},
    {"executed_at": 12345},
    {"outcome": "private-marker"},
    {"raw_log": "private-marker"},
    {"external_run_id": "https://example.invalid/private-marker"},
    {"external_result_id": "x" * 129},
    {"script_path": "../private-marker.spec.ts"},
    {"script_path": "https://example.invalid/private-marker.spec.ts"},
])
def test_invalid_input_is_rejected_without_echo(overrides):
    case_id = uuid4()
    path = f"/api/v1/test-cases/{case_id}/execution-evidence"
    response = client.post(path, json=payload(case_id) | overrides)
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid execution result"}


def test_bounded_body_wrong_content_type_and_no_write_methods():
    case_id = uuid4()
    path = f"/api/v1/test-cases/{case_id}/execution-evidence"
    assert client.post(path, content=b"x" * 4097, headers={"Content-Type": "application/json"}).status_code == 413
    assert client.post(path, content="{}").status_code == 415
    assert client.post(path, json=payload(uuid4())).status_code == 422
    assert client.put(path, json={}).status_code == 405
    assert client.patch(path, json={}).status_code == 405
    assert client.delete(path).status_code == 405
