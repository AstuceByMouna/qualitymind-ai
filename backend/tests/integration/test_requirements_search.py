"""QA-85: real PostgreSQL global search on strictly isolated test database."""
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db import SessionLocal, engine
from app.main import app
from app.models.requirement import Requirement

BASE = "/api/v1/requirements"


def test_global_search_filters_before_pagination_and_escapes_like_metacharacters():
    assert engine.url.database == "qualitymind_test", "Refusing to mutate DEV or QA data"
    assert engine.url.host in {"127.0.0.1", "localhost"}, "Refusing remote DB writes"

    prefix = f"QA85-{uuid4().hex[:16]}"
    entries = [
        Requirement(
            title=f"{prefix} Searched {index}",
            description=f"Specific fixture for global search {prefix}",
        )
        for index in range(7)
    ]
    special = Requirement(
        title=f"{prefix} 100%_literal",
        description=f"Special wildcard fixture {prefix}",
    )
    entries.append(special)
    ids = []
    try:
        with SessionLocal() as db:
            db.add_all(entries)
            db.commit()
            ids = [item.id for item in entries]

        client = TestClient(app)
        # The 8 matching records exceed page size 5.
        first = client.get(BASE, params={"limit": 5, "offset": 0, "q": prefix.upper()})
        second = client.get(BASE, params={"limit": 5, "offset": 5, "q": prefix})
        assert first.status_code == second.status_code == 200
        page1, page2 = first.json(), second.json()
        assert page1["total"] == page2["total"] == 8
        assert len(page1["items"]) == 5 and len(page2["items"]) == 3
        found = {item["id"] for item in page1["items"] + page2["items"]}
        assert found == {str(item_id) for item_id in ids}

        wildcard = client.get(BASE, params={"q": "100%_literal"})
        assert wildcard.status_code == 200
        assert wildcard.json()["total"] == 1
        assert wildcard.json()["items"][0]["id"] == str(special.id)

        absent = client.get(BASE, params={"q": f"{prefix}-not-found"})
        assert absent.status_code == 200
        assert absent.json()["total"] == 0
        assert absent.json()["items"] == []

        uuid_match = client.get(BASE, params={"q": str(special.id)[:12]})
        assert uuid_match.status_code == 200
        assert any(item["id"] == str(special.id) for item in uuid_match.json()["items"])

        blank = client.get(BASE, params={"q": "  "})
        assert blank.status_code == 200
        assert blank.json()["total"] >= 8
    finally:
        if ids:
            with SessionLocal() as db:
                db.execute(delete(Requirement).where(Requirement.id.in_(ids)))
                db.commit()
