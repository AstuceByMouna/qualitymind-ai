"""QA-112: persisted Playwright reference, no execution, isolated PostgreSQL."""
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement


def test_automation_association_is_metadata_only_and_safe():
    assert engine.url.database == "qualitymind_test", "Never write to DEV or QA in integration tests"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "No remote DB writes"

    rid = uuid4()
    client = TestClient(app)
    with SessionLocal() as db:
        db.add(Requirement(
            id=rid,
            title="QA112 isolated script reference",
            description="Disposable integration fixture",
        ))
        db.commit()
    try:
        criterion = client.post(
            f"/api/v1/requirements/{rid}/acceptance-criteria",
            json={"content": "When a valid customer logs in, the dashboard is displayed."},
        )
        assert criterion.status_code == 201, criterion.text
        saved = client.post(
            f"/api/v1/requirements/{rid}/test-cases",
            json={"criterion_id": criterion.json()["id"], "kind": "POSITIVE"},
        )
        assert saved.status_code == 201, saved.text
        test_id = saved.json()["id"]
        path = f"/api/v1/test-cases/{test_id}/automation"

        initial = client.get(path)
        assert initial.status_code == 200
        assert initial.json()["playwright_script_path"] is None
        assert initial.json()["execution_status"] == "NOT_EXECUTED"

        assigned = client.patch(
            path,
            json={"playwright_script_path": "frontend/tests/e2e/login.spec.ts"},
        )
        assert assigned.status_code == 200, assigned.text
        assert assigned.json()["execution_status"] == "NOT_EXECUTED"

        persisted = client.get(path)
        assert persisted.status_code == 200
        assert persisted.json()["playwright_script_path"] == "frontend/tests/e2e/login.spec.ts"

        for invalid in ("../secret.spec.ts", "/etc/file.spec.ts", "https://example.com/a.spec.ts"):
            res = client.patch(path, json={"playwright_script_path": invalid})
            assert res.status_code == 422, res.text
            assert client.get(path).json()["playwright_script_path"] == "frontend/tests/e2e/login.spec.ts"

        assert client.patch(
            path,
            json={"playwright_script_path": "tests/new.spec.ts", "approved": True},
        ).status_code == 422
        assert client.get(f"/api/v1/test-cases/{uuid4()}/automation").status_code == 404

        assert client.post(f"/api/v1/requirements/{rid}/archive").status_code == 200
        assert client.patch(path, json={"playwright_script_path": "tests/new.spec.ts"}).status_code == 409
        assert client.get(path).json()["playwright_script_path"] == "frontend/tests/e2e/login.spec.ts"
    finally:
        with SessionLocal() as db:
            requirement = db.get(Requirement, rid)
            if requirement is not None:
                db.delete(requirement)
                db.commit()
