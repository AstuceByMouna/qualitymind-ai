"""QA-84: real PATCH persistence, strictly isolated in the CI test database."""
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement


def test_patch_persists_and_cleans_up_in_isolated_postgres():
    # Hard fail before any DB writes if someone points this test at DEV or QA.
    assert engine.url.database == "qualitymind_test", "Refusing writes outside qualitymind_test"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "Refusing remote database writes"

    requirement_id = uuid4()
    with SessionLocal() as db:
        model = Requirement(
            id=requirement_id,
            title="QA84 isolated original",
            description="QA84 isolated original description",
        )
        db.add(model)
        db.commit()
        db.refresh(model)
        created_at = model.created_at

    try:
        response = TestClient(app).patch(
            f"/api/v1/requirements/{requirement_id}",
            json={"title": "  QA84 isolated edited  "},
        )
        assert response.status_code == 200
        assert response.json()["id"] == str(requirement_id)
        assert response.json()["title"] == "QA84 isolated edited"
        assert response.json()["description"] == "QA84 isolated original description"

        # Read from a fresh DB session, not just the HTTP response.
        with SessionLocal() as db:
            updated = db.get(Requirement, requirement_id)
            assert updated is not None
            assert updated.id == requirement_id
            assert updated.title == "QA84 isolated edited"
            assert updated.description == "QA84 isolated original description"
            assert updated.created_at == created_at
    finally:
        # Delete exactly this randomly-identified test fixture even after failure.
        with SessionLocal() as db:
            record = db.get(Requirement, requirement_id)
            if record is not None:
                db.delete(record)
                db.commit()

    with SessionLocal() as db:
        assert db.scalar(
            select(Requirement.id).where(Requirement.id == requirement_id)
        ) is None
