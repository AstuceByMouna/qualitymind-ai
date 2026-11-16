"""QA-97 validation of archive endpoints without database access."""
from uuid import UUID
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.modules.requirements.application.service import RequirementNotFoundError

ID = UUID("12345678-1234-4678-9234-567812345678")
def test_archive_not_found():
    with patch("app.api.v1.requirements._service") as factory:
        factory.return_value.set_archived.side_effect = RequirementNotFoundError("Requirement not found")
        for action in ("archive","restore"):
            r = TestClient(app).post(f"/api/v1/requirements/{ID}/{action}")
            assert r.status_code == 404
        assert factory.return_value.set_archived.call_count == 2
def test_invalid_uuid_rejected_without_service_call():
    with patch("app.api.v1.requirements._service") as factory:
        assert TestClient(app).post("/api/v1/requirements/invalid/archive").status_code == 422
        factory.assert_not_called()
