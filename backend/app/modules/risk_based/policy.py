"""QA-111: stored draft counts are not evidence of approved test coverage."""
from typing import Literal

DraftState = Literal["NO_DRAFT", "DRAFT_ONLY"]


def draft_state(draft_count: int) -> DraftState:
    if draft_count < 0:
        raise ValueError("draft_count must be nonnegative")
    return "DRAFT_ONLY" if draft_count > 0 else "NO_DRAFT"


def requires_test_design(risk_level: str, draft_count: int) -> bool:
    """HIGH with no draft merits work, not a quality gate approval."""
    return risk_level == "HIGH" and draft_state(draft_count) == "NO_DRAFT"
