"""PostgreSQL integration checks. Requires isolated qualitymind_test database."""
import os
from uuid import UUID

if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("Integration tests require POSTGRES_DB=qualitymind_test")

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement

BASE_URL = "/api/v1/requirements"


def test_database_connection():
    assert engine.url.database == "qualitymind_test"
    with engine.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar() == 1


def test_create_and_retrieve_requirement():
    client = TestClient(app)
    requirement_id = None
    try:
        response = client.post(
            BASE_URL,
            json={
                "title": "Integration Test Requirement",
                "description": "Created by automated integration test",
            },
        )
        assert response.status_code == 201
        requirement_id = UUID(response.json()["id"])
        with SessionLocal() as db:
            model = db.get(Requirement, requirement_id)
            assert model is not None
            assert model.title == "Integration Test Requirement"
        detail = client.get(f"{BASE_URL}/{requirement_id}")
        assert detail.status_code == 200
        assert detail.json()["id"] == str(requirement_id)
        page = client.get(f"{BASE_URL}?limit=1&offset=0")
        assert page.status_code == 200
        assert page.json()["limit"] == 1
        assert page.json()["total"] >= 1
        assert len(page.json()["items"]) <= 1
    finally:
        if requirement_id is not None:
            with SessionLocal() as db:
                model = db.get(Requirement, requirement_id)
                if model is not None:
                    db.delete(model)
                    db.commit()
