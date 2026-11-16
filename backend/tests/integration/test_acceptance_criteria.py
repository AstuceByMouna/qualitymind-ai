"""QA-94 real CRUD and atomic order in isolated PostgreSQL test DB only."""
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal, engine
from app.main import app
from app.models.acceptance_criterion import AcceptanceCriterion
from app.models.requirement import Requirement


def test_acceptance_criteria_are_ordered_scoped_editable_and_deletable():
    assert engine.url.database == "qualitymind_test", "Refusing DEV/QA writes"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "Refusing remote DB writes"
    requirement_a, requirement_b = uuid4(), uuid4()

    with SessionLocal() as db:
        db.add_all([
            Requirement(id=requirement_a, title="QA94-A", description="Isolated test"),
            Requirement(id=requirement_b, title="QA94-B", description="Isolated test"),
        ])
        db.commit()
    client = TestClient(app)
    a = f"/api/v1/requirements/{requirement_a}/acceptance-criteria"
    b = f"/api/v1/requirements/{requirement_b}/acceptance-criteria"
    try:
        assert client.get(a).json() == {"items": []}
        assert client.get(b).json() == {"items": []}
        created = []
        for text in ("First", "Second", "Third"):
            response = client.post(a, json={"content": text})
            assert response.status_code == 201, response.text
            created.append(response.json())
        assert [item["position"] for item in created] == [1, 2, 3]
        criterion_id = created[1]["id"]
        wrong_parent = client.patch(
            f"{b}/{criterion_id}", json={"content": "Wrong parent"}
        )
        assert wrong_parent.status_code == 404
        changed = client.patch(
            f"{a}/{criterion_id}", json={"content": "  Second updated  "}
        )
        assert changed.status_code == 200
        assert changed.json()["id"] == criterion_id
        assert changed.json()["content"] == "Second updated"
        assert client.get(b).json() == {"items": []}

        deleted = client.delete(f"{a}/{created[0]['id']}")
        assert deleted.status_code == 204
        assert client.delete(f"{a}/{created[0]['id']}").status_code == 404
        rows = client.get(a).json()["items"]
        assert [row["content"] for row in rows] == ["Second updated", "Third"]
        assert [row["position"] for row in rows] == [1, 2]
        assert client.get(f"/api/v1/requirements/{requirement_a}").json()["title"] == "QA94-A"

        with SessionLocal() as db:
            stored = db.scalars(
                select(AcceptanceCriterion)
                .where(AcceptanceCriterion.requirement_id == requirement_a)
                .order_by(AcceptanceCriterion.position)
            ).all()
            assert [item.content for item in stored] == ["Second updated", "Third"]
    finally:
        # Delete only the two dedicated requirements; FK cascade clears criteria.
        with SessionLocal() as db:
            for req in (requirement_a, requirement_b):
                item = db.get(Requirement, req)
                if item is not None:
                    db.delete(item)
            db.commit()
        with SessionLocal() as db:
            assert db.scalars(
                select(AcceptanceCriterion).where(
                    AcceptanceCriterion.requirement_id.in_((requirement_a, requirement_b))
                )
            ).all() == []


def test_missing_parent_never_creates_a_criterion():
    assert engine.url.database == "qualitymind_test", "Refusing DEV/QA writes"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "Refusing remote DB writes"
    absent = uuid4()
    response = TestClient(app).post(
        f"/api/v1/requirements/{absent}/acceptance-criteria",
        json={"content": "Should not persist"},
    )
    assert response.status_code == 404
    with SessionLocal() as db:
        assert db.scalars(
            select(AcceptanceCriterion).where(AcceptanceCriterion.requirement_id == absent)
        ).all() == []
