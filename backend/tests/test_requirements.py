"""Tests API pour la création d'une exigence (QA-49)."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import UUID

from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app


def test_create_requirement():
    """L'API enregistre une exigence via la session SQLAlchemy simulée."""
    db = MagicMock()

    def simulate_refresh(requirement):
        """Simule les champs remplis par la base après l'enregistrement."""
        requirement.id = UUID("12345678-1234-5678-1234-567812345678")
        requirement.created_at = datetime(2026, 11, 8, tzinfo=timezone.utc)

    db.refresh.side_effect = simulate_refresh
    app.dependency_overrides[get_db] = lambda: db

    try:
        client = TestClient(app)
        response = client.post(
            "/requirements",
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
        # Évite que le mock influence les autres tests de l'application.
        app.dependency_overrides.clear()
def test_create_requirement_with_empty_title():
    client = TestClient(app)

    response = client.post(
        "/requirements",
        json={
            "title": "   ",
            "description": "Description valide",
        },
    )

    assert response.status_code == 422