"""Real PostgreSQL tests using only the disposable qualitymind_test database."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError

from app.db import SessionLocal, engine
from app.main import app
from app.models.execution_evidence import ExecutionEvidence
from app.models.quality_governance import ReleaseEvidence
from app.models.requirement import Requirement
from app.models.test_case import TestCase as DraftCase


@pytest.fixture
def synthetic_draft():
    assert engine.url.database == "qualitymind_test"
    assert engine.url.host in {"127.0.0.1", "localhost"}
    requirement_id, case_id = uuid4(), uuid4()
    with SessionLocal() as db:
        assert db.scalar(text("SELECT current_database()")) == "qualitymind_test"
        db.add(Requirement(id=requirement_id, title="QA-127 synthetic", description="Synthetic declaration"))
        db.flush()
        db.add(DraftCase(
            id=case_id, requirement_id=requirement_id, source_criterion="Synthetic",
            kind="POSITIVE", title="Synthetic", preconditions="Ready", steps="Review",
            expected_result="Visible", playwright_script_path="tests/synthetic.spec.ts",
        ))
        db.commit()
    # History is intentionally preserved in this disposable test database.
    return requirement_id, case_id


def result(case_id):
    return {
        "test_case_id": str(case_id), "external_run_id": "synthetic-run",
        "external_result_id": "synthetic-result", "script_path": "tests/synthetic.spec.ts",
        "tested_commit_sha": "A" * 40, "executed_at": "2026-11-28T08:15:00-05:00",
        "outcome": "PASS",
    }


def test_history_retry_conflict_and_immutable_context(synthetic_draft):
    requirement_id, case_id = synthetic_draft
    client = TestClient(app)
    path = f"/api/v1/test-cases/{case_id}/execution-evidence"
    data = result(case_id)
    with SessionLocal() as db:
        release_count = db.scalar(select(func.count()).select_from(ReleaseEvidence))
    assert client.get(path).json() == {"items": [], "next_offset": None}
    assert client.post(path, json=data | {"script_path": "other.spec.ts"}).status_code == 409
    absent = uuid4()
    assert client.post(f"/api/v1/test-cases/{absent}/execution-evidence", json=result(absent)).status_code == 404

    created = client.post(path, json=data)
    assert created.status_code == 201, created.text
    first = created.json()
    assert first["requirement_id"] == str(requirement_id)
    assert first["provenance"] == "USER_IMPORTED"
    assert first["tested_commit_sha"] == "a" * 40
    assert first["executed_at"] == "2026-11-28T13:15:00Z"
    assert first["context_changed"] is False
    replay = client.post(path, json=data | {"executed_at": "2026-11-28T13:15:00Z"})
    assert replay.status_code == 200
    assert replay.json() == first
    assert client.post(path, json=data | {"outcome": "FAIL"}).status_code == 409

    new_data = data | {"external_result_id": "result-2", "outcome": "FAIL"}
    assert client.post(path, json=new_data).status_code == 201
    history = client.get(path).json()["items"]
    assert [row["outcome"] for row in history] == ["FAIL", "PASS"]
    assert history[0]["id"] != first["id"]
    association = f"/api/v1/test-cases/{case_id}/automation"
    assert client.patch(association, json={"playwright_script_path": "tests/other.spec.ts"}).status_code == 200
    changed = client.get(path).json()["items"][-1]
    assert changed == first | {"context_changed": True}
    assert client.post(path, json=data).json()["id"] == first["id"]
    assert client.get(association).json()["execution_status"] == "NOT_EXECUTED"

    with SessionLocal() as db:
        case = db.get(DraftCase, case_id)
        assert case.status == "DRAFT"
        case.playwright_script_path = data["script_path"]
        case.steps = "Edited synthetic definition"
        db.commit()
        assert db.scalar(select(func.count()).select_from(ReleaseEvidence)) == release_count
    assert client.get(path).json()["items"][-1]["context_changed"] is True
    assert client.post(f"/api/v1/requirements/{requirement_id}/archive").status_code == 200
    assert client.post(path, json=data | {"external_result_id": "result-3"}).status_code == 409
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(ExecutionEvidence)
                         .where(ExecutionEvidence.test_case_id == case_id)) == 2
        db.delete(db.get(Requirement, requirement_id))
        with pytest.raises(IntegrityError):
            db.flush()
        db.rollback()


def test_concurrent_identical_and_conflicting_imports(synthetic_draft):
    _, case_id = synthetic_draft
    path = f"/api/v1/test-cases/{case_id}/execution-evidence"
    data = result(case_id)

    def submit_pair(first, second):
        barrier = Barrier(2)

        def submit(payload):
            barrier.wait(timeout=10)
            return TestClient(app).post(path, json=payload)

        with ThreadPoolExecutor(max_workers=2) as pool:
            return list(pool.map(submit, [first, second]))

    responses = submit_pair(data, data)
    assert sorted(item.status_code for item in responses) == [200, 201]
    assert len({item.json()["id"] for item in responses}) == 1
    conflict = data | {"external_result_id": "concurrent-conflict"}
    responses = submit_pair(conflict, conflict | {"outcome": "ERROR"})
    assert sorted(item.status_code for item in responses) == [201, 409]
    assert len(TestClient(app).get(path).json()["items"]) == 2
