"""QA-84: API PATCH contract tests, isolated from PostgreSQL."""
from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app
from app.models.requirement import Requirement

BASE = "/api/v1/requirements"
ID = UUID("12345678-1234-4678-9234-567812345678")
CREATED = datetime(2026, 11, 14, tzinfo=timezone.utc)


@pytest.fixture
def database():
    db = MagicMock()
    db.get.return_value = Requirement(
        id=ID, title="Original title", description="Original description",
        created_at=CREATED,
    )
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield db
    finally:
        app.dependency_overrides.clear()


def test_patch_title_only_preserves_description_and_identity(database):
    response = TestClient(app).patch(f"{BASE}/{ID}", json={"title": "  Updated title  "})
    assert response.status_code == 200
    body = response.json()
    assert (body["id"], body["title"], body["description"]) == (
        str(ID), "Updated title", "Original description"
    )
    assert body["created_at"].startswith("2026-11-14T")
    database.commit.assert_called_once()
    database.refresh.assert_called_once()


def test_patch_description_only(database):
    response = TestClient(app).patch(
        f"{BASE}/{ID}", json={"description": "  Updated description  "}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Original title"
    assert response.json()["description"] == "Updated description"
    database.commit.assert_called_once()


def test_patch_both_fields(database):
    response = TestClient(app).patch(
        f"{BASE}/{ID}", json={"title": "T2", "description": "D2"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "T2"
    assert response.json()["description"] == "D2"


def test_patch_missing_requirement_returns_404_without_commit(database):
    database.get.return_value = None
    response = TestClient(app).patch(f"{BASE}/{ID}", json={"title": "New"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Requirement not found"
    database.commit.assert_not_called()


@pytest.mark.parametrize("payload", [
    {}, {"title": None}, {"description": None},
    {"title": "   "}, {"description": "  "},
    {"title": "X" * 256}, {"description": "X" * 10001},
    {"title": "nul\\u0000value"}, {"description": "bad\\u0000value"},
    {"title": 42}, {"description": []}, {"unknown": "field"},
])
def test_patch_invalid_payload_never_writes(database, payload):
    response = TestClient(app).patch(f"{BASE}/{ID}", json=payload)
    assert response.status_code == 422
    database.commit.assert_not_called()


def test_patch_invalid_uuid_returns_422_without_commit(database):
    response = TestClient(app).patch(f"{BASE}/not-a-uuid", json={"title": "New"})
    assert response.status_code == 422
    database.commit.assert_not_called()


def test_patch_boundaries_accepted(database):
    response = TestClient(app).patch(
        f"{BASE}/{ID}", json={"title": "X" * 255, "description": "Y" * 10000}
    )
    assert response.status_code == 200
    assert len(response.json()["title"]) == 255
    assert len(response.json()["description"]) == 10000


def test_patch_openapi_contract():
    patch = TestClient(app).get("/openapi.json").json()["paths"][
        "/api/v1/requirements/{requirement_id}"
    ]["patch"]
    assert "200" in patch["responses"]
    assert "404" in patch["responses"]
    assert "422" in patch["responses"]
