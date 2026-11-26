"""QA-111: a draft is not approved or executed test coverage."""
import pytest

from app.modules.risk_based.policy import draft_state, requires_test_design


def test_draft_state_is_not_coverage():
    assert draft_state(0) == "NO_DRAFT"
    assert draft_state(1) == "DRAFT_ONLY"
    assert draft_state(50) == "DRAFT_ONLY"
    with pytest.raises(ValueError):
        draft_state(-1)


def test_only_high_without_drafts_triggers_initial_test_design_alert():
    assert requires_test_design("HIGH", 0) is True
    assert requires_test_design("HIGH", 1) is False
    assert requires_test_design("MEDIUM", 0) is False
    assert requires_test_design("UNKNOWN", 0) is False
