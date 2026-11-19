"""DC-01: deterministic evidence policy, including negative paths."""
from uuid import UUID

from app.modules.quality_governance.readiness import assess_release

OID = UUID("00000000-0000-4000-8000-000000000001")
RID = UUID("00000000-0000-4000-8000-000000000002")


def obligation(critical=True):
    return [{"id": OID, "requirement_id": RID, "title": "Control", "critical": critical}]


def evidence(result="PASS", tested_version="1.2"):
    return {str(OID): {"result": result, "tested_version": tested_version}}


def test_empty_release_never_approves():
    assert assess_release("1.2", [], {})["state"] == "UNDETERMINED"


def test_missing_evidence_is_not_pass():
    result = assess_release("1.2", obligation(), {})
    assert result["state"] == "UNDETERMINED"
    assert result["obligations"][0]["evidence_status"] == "MISSING"


def test_previous_version_is_stale():
    result = assess_release("1.2", obligation(), evidence(tested_version="1.1"))
    assert result["state"] == "UNDETERMINED"
    assert result["obligations"][0]["evidence_status"] == "STALE"


def test_critical_failure_blocks():
    assert assess_release("1.2", obligation(), evidence("FAIL"))["state"] == "NO_GO"


def test_noncritical_failure_requires_human_review():
    assert assess_release("1.2", obligation(False), evidence("FAIL"))["state"] == "REVIEW_REQUIRED"


def test_all_pass_cannot_auto_go():
    result = assess_release("1.2", obligation(), evidence())
    assert result["state"] == "REVIEW_REQUIRED"
    assert result["obligations"][0]["evidence_status"] == "PASS"


def test_critical_failure_takes_precedence_over_missing():
    another = {"id": UUID("00000000-0000-4000-8000-000000000003"), "requirement_id": RID, "title": "Other", "critical": True}
    assert assess_release("1.2", obligation() + [another], evidence("FAIL"))["state"] == "NO_GO"
