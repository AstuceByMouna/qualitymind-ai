"""QA-97 archival round trip on isolated database."""
import os
from uuid import UUID
if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("Integration tests require POSTGRES_DB=qualitymind_test")
from fastapi.testclient import TestClient
from app.db import SessionLocal
from app.main import app
from app.models.requirement import Requirement

def test_archive_restore_preserves_identity_and_history():
    client = TestClient(app)
    response = client.post("/api/v1/requirements",json={"title":"QA97 Unique archive","description":"Preserve me"})
    assert response.status_code == 201
    rid = response.json()["id"]
    try:
        for _ in range(2):
            r = client.post(f"/api/v1/requirements/{rid}/archive")
            assert r.status_code == 200 and r.json()["archived_at"]
        assert client.get(f"/api/v1/requirements/{rid}").json()["id"] == rid
        listed = client.get("/api/v1/requirements",params={"q":"QA97 Unique archive"}).json()
        assert not any(x["id"] == rid for x in listed["items"])
        assert any(x["id"] == rid for x in client.get("/api/v1/requirements",params={"q":"QA97 Unique archive","archived":True}).json()["items"])
        for _ in range(2):
            restored = client.post(f"/api/v1/requirements/{rid}/restore")
            assert restored.status_code == 200 and restored.json()["archived_at"] is None
        assert any(x["id"] == rid for x in client.get("/api/v1/requirements",params={"q":"QA97 Unique archive"}).json()["items"])
    finally:
        with SessionLocal() as session:
            entity = session.get(Requirement,UUID(rid))
            if entity:
                session.delete(entity)
                session.commit()
