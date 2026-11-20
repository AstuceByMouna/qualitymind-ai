"""QA-103: HTTP schema/validation contract with no DB calls."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
BASE = "/api/v1/releases/00000000-0000-4000-8000-000000000001/challenges"


def test_contract_exposes_only_challenger_and_never_approves():
    paths = client.get("/openapi.json").json()["paths"]
    assert BASE.replace("00000000-0000-4000-8000-000000000001", "{release_id}") in paths
    assert BASE.replace("00000000-0000-4000-8000-000000000001", "{release_id}") + "/assessment" in paths
    assert not any("/approve" in path for path in paths)
    assert not any(path.endswith("/go") for path in paths)


def test_invalid_challenge_payload_is_rejected_before_database():
    response = client.post(BASE, json={
        "obligation_id": "00000000-0000-4000-8000-000000000002",
        "version": "2026.11.19",
        "source": "manual",
        "owner": "qa-reviewer",
        "reason": "   ",
        "severity": "CRITICAL",
    })
    assert response.status_code == 422


def test_status_transition_requires_actor_and_reason():
    url = BASE + "/00000000-0000-4000-8000-000000000003/transitions"
    for payload in [
        {"to_status": "QUALIFIED", "actor": "", "justification": "Some review"},
        {"to_status": "QUALIFIED", "actor": "qa-reviewer", "justification": ""},
        {"to_status": "OPEN_UNQUALIFIED", "actor": "qa-reviewer", "justification": "invalid"},
    ]:
        assert client.post(url, json=payload).status_code == 422
