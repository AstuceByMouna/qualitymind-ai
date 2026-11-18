"""DC-01: API constraints cannot silently authorize a release."""
from datetime import datetime, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app

client = TestClient(app)
BASE = "/api/v1/releases"


def test_governance_contract_and_no_go_endpoint():
    schema = client.get("/openapi.json").json()
    assert BASE in schema["paths"]
    assert f"{BASE}/{{release_id}}/readiness" in schema["paths"]
    assert not any("/approve" in path for path in schema["paths"])
    assert client.post(BASE, json={"name": " ", "version": "1.2"}).status_code == 422
    assert client.post(BASE, json={"name": "Release", "version": ""}).status_code == 422


def test_release_create_with_isolated_fake_session():
    fake = MagicMock()
    def refresh(item):
        from uuid import UUID
        item.id = UUID("00000000-0000-4000-8000-000000000001")
        item.created_at = datetime(2026, 11, 18, tzinfo=timezone.utc)

    fake.refresh.side_effect = refresh
    app.dependency_overrides[get_db] = lambda: fake
    try:
        response = client.post(BASE, json={"name": " Test release ", "version": " 1.2 "})
        assert response.status_code == 201
        assert response.json()["name"] == "Test release"
        assert response.json()["version"] == "1.2"
        fake.add.assert_called_once()
        fake.commit.assert_called_once()
    finally:
        app.dependency_overrides.clear()


def test_missing_release_is_404():
    fake = MagicMock()
    fake.get.return_value = None
    app.dependency_overrides[get_db] = lambda: fake
    try:
        assert client.get(f"{BASE}/00000000-0000-4000-8000-000000000099/readiness").status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_malformed_evidence_rejected_without_db_access():
    response = client.post(
        f"{BASE}/00000000-0000-4000-8000-000000000001/obligations/00000000-0000-4000-8000-000000000002/evidence",
        json={"reference": "run-7", "tested_version": "1.2", "result": "UNKNOWN"},
    )
    assert response.status_code == 422
