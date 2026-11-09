
import os
from uuid import UUID

from app.db import SessionLocal
from app.models.requirement import Requirement
# IMPORTANT : sélectionner la base de test avant d'importer l'application.
if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError(
        "Integration tests require POSTGRES_DB=qualitymind_test"
    )

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app


def test_database_connection():
    assert engine.url.database == "qualitymind_test"

    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1")).scalar()

    assert result == 1

def test_create_and_retrieve_requirement():
    client = TestClient(app)
    requirement_id = None

    try:
        # 1. Créer une exigence via l'API
        response = client.post(
            "/requirements",
            json={
                "title": "Integration Test Requirement",
                "description": "Created by automated integration test",
            },
        )

        assert response.status_code == 201

        requirement_id = UUID(response.json()["id"])

        # 2. Vérifier la persistance réelle dans PostgreSQL
        with SessionLocal() as db:
            requirement = db.get(Requirement, requirement_id)

            assert requirement is not None
            assert requirement.title == "Integration Test Requirement"

        # 3. Récupérer l'exigence via l'API
        get_response = client.get(
            f"/requirements/{requirement_id}"
        )

        assert get_response.status_code == 200
        assert get_response.json()["id"] == str(requirement_id)

    finally:
        # 4. Supprimer uniquement la donnée créée par ce test
        if requirement_id is not None:
            with SessionLocal() as db:
                requirement = db.get(Requirement, requirement_id)

                if requirement is not None:
                    db.delete(requirement)
                    db.commit()
