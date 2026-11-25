"""QA-107 deterministic suggestions must not fabricate negative outcomes."""
from uuid import uuid4

from app.modules.test_design.suggestions import propose


def test_generates_two_traceable_reviewable_cases():
    cid = uuid4()
    rows = propose(cid, "Given valid credentials, when signing in, access is granted.", 2)
    assert [r["kind"] for r in rows] == ["POSITIVE", "NEGATIVE"]
    assert all(r["criterion_id"] == cid for r in rows)
    assert all(r["source_criterion"].startswith("Given valid") for r in rows)
    assert all(r["title"] and r["preconditions"] and r["steps"] and r["expected_result"] for r in rows)
    assert rows[0]["requires_rule_clarification"] is False
    assert rows[1]["requires_rule_clarification"] is True
    assert "NOT SPECIFIED" in rows[1]["expected_result"]
    assert "unauthorized" not in rows[1]["expected_result"].lower()
