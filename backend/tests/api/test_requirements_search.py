"""QA-85: global search contract, pagination, and bounded query."""
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.db import get_db
from app.main import app

BASE = "/api/v1/requirements"


def test_search_is_applied_to_count_and_rows_before_pagination():
    db = MagicMock()
    db.scalar.return_value = 7
    db.scalars.return_value.all.return_value = []
    app.dependency_overrides[get_db] = lambda: db
    try:
        response = TestClient(app).get(BASE, params={
            "limit": 5, "offset": 5, "q": "  Login  "
        })
        assert response.status_code == 200
        assert response.json() == {
            "items": [], "total": 7, "limit": 5, "offset": 5
        }
        count_sql = str(db.scalar.call_args.args[0]).upper()
        rows_sql = str(db.scalars.call_args.args[0]).upper()
        assert "WHERE" in count_sql and "WHERE" in rows_sql
        assert "LIKE" in count_sql and "LIKE" in rows_sql
        assert "LOWER(" in count_sql and "LOWER(" in rows_sql
        assert "LIMIT" in rows_sql and "OFFSET" in rows_sql
        assert "Login" not in rows_sql  # bound, never string interpolated SQL
    finally:
        app.dependency_overrides.clear()


def test_empty_or_blank_query_preserves_unfiltered_listing():
    db = MagicMock()
    db.scalar.return_value = 1
    db.scalars.return_value.all.return_value = []
    app.dependency_overrides[get_db] = lambda: db
    try:
        client = TestClient(app)
        for params in ({}, {"q": ""}, {"q": "   "}):
            assert client.get(BASE, params=params).status_code == 200
        # The default listing must exclude archives, even without a text query.
        count_sql = str(db.scalar.call_args.args[0]).upper()
        rows_sql = str(db.scalars.call_args.args[0]).upper()
        assert "ARCHIVED_AT IS NULL" in count_sql
        assert "ARCHIVED_AT IS NULL" in rows_sql
        assert " LIKE " not in count_sql
        assert " LIKE " not in rows_sql
    finally:
        app.dependency_overrides.clear()


def test_query_is_bounded_by_api_contract():
    response = TestClient(app).get(BASE, params={"q": "X" * 201})
    assert response.status_code == 422


def test_search_openapi_contract():
    api = TestClient(app).get("/openapi.json").json()
    parameters = api["paths"][BASE]["get"]["parameters"]
    query = next(item for item in parameters if item["name"] == "q")
    assert query["in"] == "query"
