"""QA-94 acceptance criteria HTTP contracts, mocked service (no DB writes)."""
from datetime import datetime, timezone
from unittest.mock import patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.requirements.application.acceptance_criteria import (
    AcceptanceCriterionNotFoundError,
    AcceptanceRequirementNotFoundError,
)
from app.modules.requirements.domain.acceptance_criteria import AcceptanceCriterionEntity

REQUIREMENT_ID = UUID("12345678-1234-4678-9234-567812345678")
OTHER_ID = UUID("22345678-1234-4678-9234-567812345678")
CRITERION_ID = UUID("32345678-1234-4678-9234-567812345678")
BASE = f"/api/v1/requirements/{REQUIREMENT_ID}/acceptance-criteria"


def entity(content="Given a valid account, when logging in, then access is granted"):
    return AcceptanceCriterionEntity(
        id=CRITERION_ID,
        requirement_id=REQUIREMENT_ID,
        content=content,
        position=1,
        created_at=datetime(2026, 11, 16, tzinfo=timezone.utc),
    )


@patch("app.api.v1.acceptance_criteria._service")
def test_list_and_empty_list(service_factory):
    service_factory.return_value.list.return_value = []
    response = TestClient(app).get(BASE)
    assert response.status_code == 200
    assert response.json() == {"items": []}
    service_factory.return_value.list.return_value = [entity()]
    response = TestClient(app).get(BASE)
    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == str(CRITERION_ID)
    assert response.json()["items"][0]["position"] == 1


@patch("app.api.v1.acceptance_criteria._service")
def test_add_normalizes_and_returns_201(service_factory):
    service_factory.return_value.add.return_value = entity()
    response = TestClient(app).post(BASE, json={"content": "  Valid criterion  "})
    assert response.status_code == 201
    service_factory.return_value.add.assert_called_once_with(
        REQUIREMENT_ID, content="Valid criterion"
    )


@patch("app.api.v1.acceptance_criteria._service")
def test_patch_updates_only_target(service_factory):
    service_factory.return_value.update.return_value = entity("Updated")
    response = TestClient(app).patch(
        f"{BASE}/{CRITERION_ID}", json={"content": "  Updated  "}
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Updated"
    service_factory.return_value.update.assert_called_once_with(
        REQUIREMENT_ID, CRITERION_ID, content="Updated"
    )


@patch("app.api.v1.acceptance_criteria._service")
def test_delete_returns_204(service_factory):
    response = TestClient(app).delete(f"{BASE}/{CRITERION_ID}")
    assert response.status_code == 204
    assert response.content == b""
    service_factory.return_value.remove.assert_called_once_with(
        REQUIREMENT_ID, CRITERION_ID
    )


@pytest.mark.parametrize("payload", [
    {}, {"content": None}, {"content": 123}, {"content": []},
    {"content": ""}, {"content": "  "},
    {"content": "X" * 2001}, {"content": f"Bad{chr(0)}text"},
    {"content": "valid", "unknown": True},
])
def test_invalid_payload_never_calls_service(payload):
    with patch("app.api.v1.acceptance_criteria._service") as factory:
        assert TestClient(app).post(BASE, json=payload).status_code == 422
        assert TestClient(app).patch(
            f"{BASE}/{CRITERION_ID}", json=payload
        ).status_code == 422
        factory.assert_not_called()


def test_invalid_uuid_returns_422():
    client = TestClient(app)
    assert client.get("/api/v1/requirements/invalid/acceptance-criteria").status_code == 422
    assert client.delete(f"{BASE}/invalid").status_code == 422


@patch("app.api.v1.acceptance_criteria._service")
def test_missing_requirement_and_criterion_return_404(factory):
    service = factory.return_value
    service.list.side_effect = AcceptanceRequirementNotFoundError("Requirement not found")
    assert TestClient(app).get(BASE).status_code == 404
    service.add.side_effect = AcceptanceRequirementNotFoundError("Requirement not found")
    assert TestClient(app).post(BASE, json={"content": "Valid"}).status_code == 404
    service.update.side_effect = AcceptanceCriterionNotFoundError("Acceptance criterion not found")
    assert TestClient(app).patch(
        f"{BASE}/{CRITERION_ID}", json={"content": "Valid"}
    ).status_code == 404
    service.remove.side_effect = AcceptanceCriterionNotFoundError("Acceptance criterion not found")
    assert TestClient(app).delete(f"{BASE}/{CRITERION_ID}").status_code == 404


def test_openapi_has_all_crud_paths():
    paths = TestClient(app).get("/openapi.json").json()["paths"]
    root = "/api/v1/requirements/{requirement_id}/acceptance-criteria"
    assert {"get", "post"}.issubset(paths[root])
    assert {"patch", "delete"}.issubset(paths[root + "/{criterion_id}"])
