"""QA-96 reproducible rule behavior and false-positive controls."""
from app.modules.requirements.application.quality_rules import analyze_requirement, RULESET_VERSION

def test_flags_vague_wording_and_missing_acceptance_criteria():
    findings = analyze_requirement("Rapide et facile", "L'application fonctionne rapidement.", [])
    assert RULESET_VERSION
    assert any(f["rule_id"] == "VAGUE-TERM" and f["evidence"]=="rapide" for f in findings)
    assert any(f["rule_id"] == "AC-CHECK" for f in findings)
    assert all(f["nature"] == "deterministic-heuristic" for f in findings)

def test_explicit_testable_requirement_does_not_invent_defects():
    findings=analyze_requirement(
        "Payment receipt",
        "Given a customer with an order, when the customer pays, the system displays a receipt within 2 seconds.",
        ["Given a paid order, when the customer opens the receipt, the system displays the reference ID."]
    )
    assert findings == []

def test_word_boundaries_do_not_flag_substrings():
    findings = analyze_requirement(
        "Breakfast", "Given a user, when breakfast ends, the system displays a receipt.",
        ["The system displays a receipt."]
    )
    assert not any(f["rule_id"]=="VAGUE-TERM" for f in findings)
