"""API contract tests for Requirements v1 (QA-60)."""
from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import UUID

from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app

BASE_URL = "/api/v1/requirements"


def test_create_requirement():
    db = MagicMock()

    def simulate_refresh(requirement):
        requirement.id = UUID("12345678-1234-5678-1234-567812345678")
        requirement.created_at = datetime(2026, 11, 8, tzinfo=timezone.utc)

    db.refresh.side_effect = simulate_refresh
    app.dependency_overrides[get_db] = lambda: db
    try:
        response = TestClient(app).post(
            BASE_URL,
            json={
                "title": " Authentification utilisateur ",
                "description": " Le système doit permettre la connexion. ",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["id"] == "12345678-1234-5678-1234-567812345678"
        assert body["title"] == "Authentification utilisateur"
        assert body["description"] == "Le système doit permettre la connexion."
        assert body["created_at"] is not None
        db.add.assert_called_once()
        db.commit.assert_called_once()
        db.refresh.assert_called_once()
    finally:
        app.dependency_overrides.clear()


def test_create_requirement_with_empty_title():
    response = TestClient(app).post(
        BASE_URL,
        json={"title": "   ", "description": "Description valide"},
    )
    assert response.status_code == 422


def test_list_page_shape_and_total():
    db = MagicMock()
    db.scalar.return_value = 3
    db.scalars.return_value.all.return_value = []
    app.dependency_overrides[get_db] = lambda: db
    try:
        response = TestClient(app).get(f"{BASE_URL}?limit=2&offset=1")
        assert response.status_code == 200
        assert response.json() == {"items": [], "total": 3, "limit": 2, "offset": 1}
        db.scalars.assert_called_once()
        statement = db.scalars.call_args.args[0]
        assert "LIMIT" in str(statement).upper()
        assert "OFFSET" in str(statement).upper()
    finally:
        app.dependency_overrides.clear()


def test_pagination_invalid_parameters():
    client = TestClient(app)
    for query in ("limit=0", "limit=201", "offset=-1"):
        assert client.get(f"{BASE_URL}?{query}").status_code == 422


def test_get_requirement_not_found():
    db = MagicMock()
    db.get.return_value = None
    app.dependency_overrides[get_db] = lambda: db
    try:
        response = TestClient(app).get(
            f"{BASE_URL}/00000000-0000-4000-8000-000000000000"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Requirement not found"
    finally:
        app.dependency_overrides.clear()


def test_get_requirement_invalid_uuid():
    assert TestClient(app).get(f"{BASE_URL}/not-a-uuid").status_code == 422


def test_openapi_contract():
    schema = TestClient(app).get("/openapi.json").json()
    post = schema["paths"][BASE_URL]["post"]
    get_detail = schema["paths"][f"{BASE_URL}/{{requirement_id}}"]["get"]
    assert "RequirementRead" in str(post["responses"]["201"])
    assert "404" in get_detail["responses"]
    assert "RequirementListResponse" in str(schema["paths"][BASE_URL]["get"])
