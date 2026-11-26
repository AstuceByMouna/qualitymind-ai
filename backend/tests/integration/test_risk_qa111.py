"""QA-111: real PostgreSQL proof on disposable qualitymind_test, never DEV."""
from uuid import uuid4
from fastapi.testclient import TestClient

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement


def test_risk_assessment_prioritization_and_draft_truth():
    assert engine.url.database == "qualitymind_test", "Refusing QA/DEV writes"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "Refusing remote writes"
    ids = [uuid4() for _ in range(4)]
    with SessionLocal() as db:
        db.add_all([
            Requirement(id=rid, title=f"QA111 synthetic {i}", description="Disposable test data")
            for i, rid in enumerate(ids)
        ])
        db.commit()
    client = TestClient(app)
    root = "/api/v1/risk/requirements"
    try:
        res = client.get(root)
        assert res.status_code == 200, res.text
        mine = [item for item in res.json()["items"] if item["id"] in {str(x) for x in ids}]
        assert len(mine) == 4
        assert all(item["risk_level"] == "UNKNOWN" and item["test_design_status"] == "NO_DRAFT" for item in mine)
        def change(id, level):
            return client.patch(f"{root}/{id}/risk", json={"risk_level": level})
        assert change(ids[0], "HIGH").status_code == 200
        assert change(ids[1], "LOW").status_code == 200
        assert change(ids[2], "MEDIUM").status_code == 200
        res = client.get(root)
        assert res.status_code == 200
        chosen = [x for x in res.json()["items"] if x["id"] in {str(i) for i in ids}]
        assert [x["risk_level"] for x in chosen] == ["HIGH", "MEDIUM", "LOW", "UNKNOWN"]
        assert chosen[0]["needs_test_design"] is True
        criterion = client.post(
            f"/api/v1/requirements/{ids[0]}/acceptance-criteria",
            json={"content": "When valid input is submitted, a confirmation is shown."},
        )
        assert criterion.status_code == 201, criterion.text
        draft = client.post(
            f"/api/v1/requirements/{ids[0]}/test-cases",
            json={"criterion_id": criterion.json()["id"], "kind": "POSITIVE"},
        )
        assert draft.status_code == 201, draft.text
        updated = change(ids[0], "HIGH")
        assert updated.status_code == 200
        assert updated.json()["draft_count"] == 1
        assert updated.json()["test_design_status"] == "DRAFT_ONLY"
        assert updated.json()["needs_test_design"] is False
        assert change(ids[0], "CRITICAL").status_code == 422
        assert client.patch(f"{root}/{ids[0]}/risk", json={"risk_level": "HIGH", "approved": True}).status_code == 422
        assert change(uuid4(), "HIGH").status_code == 404
        assert client.post(f"/api/v1/requirements/{ids[1]}/archive").status_code == 200
        assert change(ids[1], "HIGH").status_code == 409
        assert str(ids[1]) not in {x["id"] for x in client.get(root).json()["items"]}
        with SessionLocal() as db:
            assert db.get(Requirement, ids[0]).risk_level == "HIGH"
    finally:
        with SessionLocal() as db:
            for rid in ids:
                req = db.get(Requirement, rid)
                if req is not None:
                    db.delete(req)
            db.commit()
