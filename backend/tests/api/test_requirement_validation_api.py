"""HTTP request-validation tests for Requirements API (QA-63)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

@pytest.mark.parametrize(
    "title,description",
    [
        ("Requirement\x00invalid", "Valid description"),
        ("A" * 256, "Valid description"),
        ("Valid title", "A" * 10001),
        ("   ", "Valid description"),
    ],
)
def test_api_rejects_invalid_requirements(title, description):
    """Invalid input must produce HTTP 422, not HTTP 500."""
    response = client.post(
        "/api/v1/requirements",
        json={
            "title": title,
            "description": description,
        },
    )

    assert response.status_code == 422
    assert "detail" in response.json()
