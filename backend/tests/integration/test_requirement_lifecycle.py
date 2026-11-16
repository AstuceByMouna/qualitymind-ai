"""QA-95 database checks run only against the isolated integration database."""
import os
from uuid import UUID, uuid4

if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("Integration tests require POSTGRES_DB=qualitymind_test")

from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.db import SessionLocal
from app.models.requirement import Requirement, RequirementStatusHistory

URL = "/api/v1/requirements"

def test_lifecycle_persists_and_preserves_data():
    client = TestClient(app)
    created = client.post(URL, json={"title": "QA-95 lifecycle", "description": "test"})
    assert created.status_code == 201
    initial = created.json()
    rid = initial["id"]
    try:
        assert initial["status"] == "Draft"
        assert client.get(f"{URL}/{rid}").json()["status"] == "Draft"
        assert any(x["id"] == rid and x["status"] == "Draft" for x in
                   client.get(URL, params={"q": "QA-95 lifecycle"}).json()["items"])
        for target in ("In Review", "Ready", "Draft"):
            response = client.post(f"{URL}/{rid}/transitions", json={"status": target})
            assert response.status_code == 200
            assert response.json()["id"] == rid
            assert response.json()["status"] == target
        before = client.get(f"{URL}/{rid}/transitions").json()
        assert [(x["from_status"], x["to_status"]) for x in before] == [
            ("Draft", "In Review"), ("In Review", "Ready"), ("Ready", "Draft")
        ]
        assert all(x["source"] == "api" and x["changed_at"] for x in before)
        assert client.post(f"{URL}/{rid}/transitions", json={"status": "Ready"}).status_code == 409
        assert client.post(f"{URL}/{rid}/transitions", json={"status": "Unknown"}).status_code == 422
        assert client.patch(f"{URL}/{rid}", json={"status": "Ready"}).status_code == 422
        assert client.post(f"{URL}/{uuid4()}/transitions", json={"status": "In Review"}).status_code == 404
        assert client.get(f"{URL}/{rid}").json()["status"] == "Draft"
        assert client.get(f"{URL}/{rid}/transitions").json() == before
        updated = client.patch(f"{URL}/{rid}", json={"title": "QA-95 edited"})
        assert updated.status_code == 200 and updated.json()["status"] == "Draft"
    finally:
        with SessionLocal() as db:
            model = db.get(Requirement, UUID(rid))
            if model:
                db.delete(model)
                db.commit()
