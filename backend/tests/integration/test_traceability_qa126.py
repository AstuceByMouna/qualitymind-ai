"""QA-126 real PostgreSQL traceability with isolated, rolled-back fixtures."""
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import event, text
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.main import app
from app.models.acceptance_criterion import AcceptanceCriterion
from app.models.requirement import Requirement
from app.models.test_case import TestCase as DraftCase


def test_traceability_uses_existing_links_without_writes(monkeypatch):
    target = engine.url
    assert target.host in {"localhost", "127.0.0.1"}
    assert target.database == "qualitymind_test" or (
        target.database == "qualitymind_qa" and target.port == 5433
        and target.username == "qualitymind_qa"
    )
    with engine.connect() as connection, connection.begin() as transaction:
        assert connection.scalar(text("SELECT current_database()")) == target.database
        if target.database == "qualitymind_qa":
            assert connection.scalar(text("SELECT current_user")) == "qualitymind_qa"

        rid, other_id = uuid4(), uuid4()
        own_id, foreign_id = uuid4(), uuid4()
        with Session(bind=connection, join_transaction_mode="create_savepoint") as seed:
            seed.add_all([
                Requirement(id=rid, title="QA-126 synthetic requirement", description="Synthetic."),
                Requirement(id=other_id, title="QA-126 other requirement", description="Synthetic."),
            ])
            seed.flush()
            seed.add_all([
                AcceptanceCriterion(id=own_id, requirement_id=rid, position=1, content="Exact source"),
                AcceptanceCriterion(id=foreign_id, requirement_id=other_id, position=1, content="Foreign source"),
            ])
            seed.flush()
            linked_id, missing_id, inconsistent_id = uuid4(), uuid4(), uuid4()
            for case_id, criterion, script in [
                (linked_id, own_id, "frontend/tests/e2e/home.spec.ts"),
                (missing_id, None, None),
                (inconsistent_id, foreign_id, None),
            ]:
                seed.add(DraftCase(
                    id=case_id, requirement_id=rid, criterion_id=criterion,
                    source_criterion="Synthetic snapshot", kind="POSITIVE",
                    title="Synthetic draft", preconditions="Synthetic",
                    steps="Check result", expected_result="Synthetic",
                    playwright_script_path=script,
                ))
            seed.commit()

        def override_db():
            with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
                yield session

        def check_sql(conn, cursor, statement, parameters, context, executemany):
            assert statement.lstrip().upper().startswith(("SELECT ", "SAVEPOINT ", "ROLLBACK TO SAVEPOINT "))

        monkeypatch.setitem(app.dependency_overrides, get_db, override_db)
        event.listen(connection, "before_cursor_execute", check_sql)
        try:
            response = TestClient(app).get(f"/api/v1/requirements/{rid}/traceability")
        finally:
            event.remove(connection, "before_cursor_execute", check_sql)
        assert response.status_code == 200
        body = response.json()
        assert body["requirement"] == {
            "id": str(rid), "title": "QA-126 synthetic requirement", "status": "Draft",
        }
        assert [criterion["id"] for criterion in body["criteria"]] == [str(own_id)]
        assert "Foreign source" not in response.text
        cases = {case["test_case_id"]: case for case in body["test_cases"]}
        assert set(cases) == {str(linked_id), str(missing_id), str(inconsistent_id)}
        assert cases[str(linked_id)]["criterion_id"] == str(own_id)
        assert cases[str(linked_id)]["criterion_link"] == "LINKED"
        assert cases[str(linked_id)]["playwright_script_path"] == "frontend/tests/e2e/home.spec.ts"
        assert cases[str(missing_id)]["criterion_id"] is None
        assert cases[str(missing_id)]["criterion_link"] == "MISSING"
        assert cases[str(missing_id)]["playwright_script_path"] is None
        assert cases[str(inconsistent_id)]["criterion_id"] == str(foreign_id)
        assert cases[str(inconsistent_id)]["criterion_link"] == "INCONSISTENT"
        assert all(case["requirement_id"] == str(rid) for case in cases.values())
        assert all(case["status"] == "DRAFT" and case["execution_status"] == "NOT_EXECUTED"
                   for case in cases.values())
        transaction.rollback()

    with Session(engine) as check:
        assert check.get(Requirement, rid) is None
        assert check.get(DraftCase, linked_id) is None
