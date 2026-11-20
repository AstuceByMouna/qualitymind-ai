"""DC-02 provisional policy. Never returns a GO or grants authority.

P0 is a draft policy for human review; an unqualified objection never
silently blocks a release. DC-01 decisions always remain in force.
"""
from collections.abc import Sequence
from typing import Any


def evaluate_challenger(
    base_state: str, version: str, challenges: Sequence[dict[str, Any]]
) -> dict[str, Any]:
    critical = [
        str(item["id"]) for item in challenges
        if item["version"] == version
        and item["status"] == "QUALIFIED"
        and item["severity"] == "CRITICAL"
        and item.get("plausible_harm")
        and item.get("required_evidence")
    ]
    qualified_open = sum(
        item["version"] == version and item["status"] == "QUALIFIED"
        for item in challenges
    )

    if base_state == "NO_GO":
        state = "NO_GO"
        explanation = "Baseline release readiness already blocks release."
    elif critical:
        state = "NO_GO"
        explanation = "A qualified unresolved critical objection requires human resolution."
    elif base_state == "UNDETERMINED":
        state = "UNDETERMINED"
        explanation = "Baseline release readiness has missing or stale evidence."
    elif base_state == "REVIEW_REQUIRED":
        state = "REVIEW_REQUIRED"
        explanation = "Human review required; Decision Challenger does not authorize GO."
    else:
        raise ValueError("Unknown baseline readiness state")

    return {
        "state": state,
        "explanation": explanation,
        "qualifying_critical_challenge_ids": critical,
        "challenges_total": len(challenges),
        "qualified_open": qualified_open,
    }
