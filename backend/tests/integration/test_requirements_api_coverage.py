"""API contract and PostgreSQL list coverage for QA-64.

Run from backend with POSTGRES_DB=qualitymind_test.
"""
import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("QA-64 integration tests require POSTGRES_DB=qualitymind_test")

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement

BASE_URL = "/api/v1/requirements"
client = TestClient(app)


def test_get_unknown_requirement_returns_404():
    response = client.get(f"{BASE_URL}/{uuid4()}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Requirement not found"


@pytest.mark.parametrize("invalid_id", ["not-a-uuid", "123", "00000000-0000-0000"])
def test_get_invalid_uuid_returns_422(invalid_id):
    response = client.get(f"{BASE_URL}/{invalid_id}")
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


@pytest.mark.parametrize(
    "params",
    [
        {"limit": 0},
        {"limit": 201},
        {"limit": -1},
        {"offset": -1},
        {"limit": "abc"},
        {"offset": "abc"},
    ],
)
def test_list_invalid_pagination_returns_422(params):
    response = client.get(BASE_URL, params=params)
    assert response.status_code == 422


def test_list_defaults_and_empty_page():
    response = client.get(BASE_URL)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"items", "total", "limit", "offset"}
    assert body["limit"] == 50
    assert body["offset"] == 0
    assert body["total"] >= 0
    assert len(body["items"]) <= 50

    empty_page = client.get(BASE_URL, params={"offset": body["total"]})
    assert empty_page.status_code == 200
    empty_body = empty_page.json()
    assert empty_body["items"] == []
    assert empty_body["total"] == body["total"]


def test_list_returns_empty_dataset(monkeypatch):
    """Contract test for a database containing no requirements."""
    import importlib

    api = importlib.import_module("app.api.v1.requirements")

    class EmptyService:
        def list_page(self, *, limit, offset):
            return [], 0

    monkeypatch.setattr(api, "_service", lambda db: EmptyService())

    response = client.get(BASE_URL, params={"limit": 2, "offset": 0})
    assert response.status_code == 200
    assert response.json() == {
        "items": [],
        "total": 0,
        "limit": 2,
        "offset": 0,
    }


def test_list_order_and_pagination_with_isolated_test_records():
    """Compare API pages against DB order; remove only records created here."""
    assert engine.url.database == "qualitymind_test"
    ids = []
    now = datetime.now(timezone.utc)
    try:
        with SessionLocal() as db:
            for i in range(3):
                requirement = Requirement(
                    title=f"QA-64 pagination test {uuid4()}",
                    description="Temporary integration-test record",
                    created_at=now + timedelta(days=365 + i),
                )
                db.add(requirement)
                db.flush()
                ids.append(requirement.id)
            db.commit()

        with SessionLocal() as db:
            expected_ids = [
                str(item)
                for item in db.scalars(
                    select(Requirement.id)
                    .order_by(Requirement.created_at.desc(), Requirement.id.desc())
                ).all()
            ]
            expected_total = db.scalar(
                select(func.count()).select_from(Requirement)
            )
        assert expected_total >= 3

        first = client.get(BASE_URL, params={"limit": 2, "offset": 0})
        second = client.get(BASE_URL, params={"limit": 2, "offset": 2})
        assert first.status_code == second.status_code == 200

        page1, page2 = first.json(), second.json()
        assert page1["total"] == page2["total"] == expected_total
        assert (page1["limit"], page1["offset"]) == (2, 0)
        assert (page2["limit"], page2["offset"]) == (2, 2)
        assert [item["id"] for item in page1["items"]] == expected_ids[:2]
        assert [item["id"] for item in page2["items"]] == expected_ids[2:4]
        assert not (
            {item["id"] for item in page1["items"]}
            & {item["id"] for item in page2["items"]}
        )
        assert set(map(str, ids)).issubset(set(expected_ids))
    finally:
        with SessionLocal() as db:
            db.query(Requirement).filter(Requirement.id.in_(ids)).delete(
                synchronize_session=False
            )
            db.commit()
