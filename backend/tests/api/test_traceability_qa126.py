"""HTTP boundary checks for the QA-126 read-only view."""
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app


def test_traceability_validates_ids_and_exposes_no_write_method():
    client = TestClient(app)
    prefix = "/api/v1/requirements/"
    assert client.get(prefix + "not-a-uuid/traceability").status_code == 422
    assert client.post(prefix + f"{uuid4()}/traceability", json={}).status_code == 405


def test_missing_and_archived_requirements_do_not_load_children(monkeypatch):
    from types import SimpleNamespace
    from unittest.mock import Mock

    repository = Mock()
    criteria = Mock()
    monkeypatch.setattr("app.api.v1.traceability.SqlAlchemyRequirementRepository", lambda _: repository)
    monkeypatch.setattr("app.api.v1.traceability.SqlAlchemyAcceptanceCriteriaRepository", criteria)
    monkeypatch.setitem(app.dependency_overrides, get_db, lambda: object())
    client = TestClient(app)
    path = f"/api/v1/requirements/{uuid4()}/traceability"

    repository.get.return_value = None
    assert client.get(path).status_code == 404
    repository.get.return_value = SimpleNamespace(archived_at=object())
    assert client.get(path).status_code == 409
    criteria.assert_not_called()
