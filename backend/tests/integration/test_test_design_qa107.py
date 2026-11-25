"""QA-107 real PostgreSQL proof on disposable qualitymind_test only."""
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement
from app.models.test_case import TestCase as StoredTestCase


def test_test_design_preview_persistence_scoping_and_rejection():
    assert engine.url.database == "qualitymind_test", "Refusing QA/DEV writes"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "Refusing remote writes"
    a, b = uuid4(), uuid4()
    with SessionLocal() as db:
        db.add_all([Requirement(id=a, title="QA107 A", description="Synthetic QA"),
                    Requirement(id=b, title="QA107 B", description="Synthetic QA")])
        db.commit()
    client = TestClient(app)
    root = f"/api/v1/requirements/{a}/test-cases"
    other = f"/api/v1/requirements/{b}/test-cases"
    try:
        assert client.get(root + "/suggestions").json() == []
        assert client.get(root).json() == []
        assert client.get(f"/api/v1/requirements/{uuid4()}/test-cases").status_code == 404
        criterion = client.post(f"/api/v1/requirements/{a}/acceptance-criteria",
                                json={"content": "When user submits valid form, save succeeds"})
        assert criterion.status_code == 201, criterion.text
        cid = criterion.json()["id"]
        suggested = client.get(root + "/suggestions")
        assert suggested.status_code == 200
        assert [x["kind"] for x in suggested.json()] == ["POSITIVE", "NEGATIVE"]
        assert client.post(other, json={"criterion_id": cid, "kind": "POSITIVE"}).status_code == 422
        assert client.post(root, json={"criterion_id": str(uuid4()), "kind": "POSITIVE"}).status_code == 422
        assert client.post(root, json={"criterion_id": cid, "kind": "INVALID"}).status_code == 422
        for kind in ("POSITIVE", "NEGATIVE"):
            saved = client.post(root, json={"criterion_id": cid, "kind": kind})
            assert saved.status_code == 201, saved.text
            assert saved.json()["status"] == "DRAFT"
            assert saved.json()["requirement_id"] == str(a)
        duplicate = client.post(root, json={"criterion_id": cid, "kind": "POSITIVE"})
        assert duplicate.status_code == 409
        persisted = client.get(root)
        assert len(persisted.json()) == 2
        assert [x["kind"] for x in persisted.json()] == ["POSITIVE", "NEGATIVE"]
        assert all(x["source_criterion"] == criterion.json()["content"] for x in persisted.json())
        with SessionLocal() as db:
            rows = db.scalars(select(StoredTestCase).where(StoredTestCase.requirement_id == a)).all()
            assert len(rows) == 2
            assert all(row.status == "DRAFT" for row in rows)
        archived = client.post(f"/api/v1/requirements/{a}/archive")
        assert archived.status_code == 200
        assert client.get(root + "/suggestions").json() == []
        assert client.post(root, json={"criterion_id": cid, "kind": "NEGATIVE"}).status_code == 409
        assert len(client.get(root).json()) == 2
        # Deleting a source criterion must preserve saved drafts and their
        # source snapshots, without returning a response-schema error.
        assert client.delete(f"/api/v1/requirements/{a}/acceptance-criteria/{cid}").status_code == 204
        retained = client.get(root)
        assert retained.status_code == 200, retained.text
        assert len(retained.json()) == 2
        assert all(case["criterion_id"] is None for case in retained.json())
        assert all(case["source_criterion"] == criterion.json()["content"] for case in retained.json())
    finally:
        with SessionLocal() as db:
            for rid in (a, b):
                item = db.get(Requirement, rid)
                if item:
                    db.delete(item)
            db.commit()
