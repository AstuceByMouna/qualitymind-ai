"""QA-124: strict schema and no sensitive input reflected in response."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_classifies_synthetic_timeout_without_echoing_excerpt():
    secret = "synthetic-sensitive-marker"
    response = client.post("/api/v1/failure-analysis/classify", json={
        "excerpt": "TimeoutError: " + secret + " exceeded",
    })
    assert response.status_code == 200
    result = response.json()
    assert result["classification"] == "TIMEOUT"
    assert result["confidence"] == "HEURISTIC"
    assert result["review_required"] is True
    assert result["execution_status"] == "NOT_EXECUTED"
    assert secret not in response.text


def test_unknown_not_claimed_as_root_cause():
    result = client.post("/api/v1/failure-analysis/classify", json={
        "excerpt": "Synthetic situation without known marker",
    })
    assert result.status_code == 200
    assert result.json()["classification"] == "UNKNOWN"
    assert result.json()["review_required"] is True


def test_rejects_blank_too_short_too_large_and_unknown_fields():
    for payload in (
        {"excerpt": " " * 12},
        {"excerpt": "tiny"},
        {"excerpt": "x" * 2001},
        {"excerpt": "AssertionError: failed", "run_script": True},
        {"excerpt": "some text\x00here"},
    ):
        response = client.post("/api/v1/failure-analysis/classify", json=payload)
        assert response.status_code == 422, response.text


def test_no_get_or_arbitrary_execution_endpoint():
    assert client.get("/api/v1/failure-analysis/classify").status_code == 405
