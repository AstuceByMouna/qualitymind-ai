
"""CORS security and configuration tests — QA-61."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

API_PATH = "/api/v1/requirements"


def test_cors_allows_frontend_origin():
    """Allowed Next.js origin receives CORS headers."""
    response = client.options(
        API_PATH,
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:3000"
    )


def test_cors_rejects_unknown_origin():
    """Unknown origin must not receive CORS permission."""
    response = client.options(
        API_PATH,
        headers={
            "Origin": "http://malicious.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
