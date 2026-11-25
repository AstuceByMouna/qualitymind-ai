"""Deterministic, review-required initial test suggestions; no model calls."""
from uuid import UUID


def propose(criterion_id: UUID, source: str, position: int) -> list[dict]:
    source = source.strip()
    stem = f"AC-{position}"
    return [
        {
            "criterion_id": criterion_id,
            "source_criterion": source,
            "kind": "POSITIVE",
            "title": f"{stem} — Verify stated acceptance outcome",
            "preconditions": "Prepare the valid context and inputs described by the acceptance criterion.",
            "steps": "1. Set up the stated preconditions.\n2. Perform the action described in the criterion.\n3. Observe the outcome.",
            "expected_result": f"Confirm the outcome explicitly required by the source criterion: {source}",
            "requires_rule_clarification": False,
        },
        {
            "criterion_id": criterion_id,
            "source_criterion": source,
            "kind": "NEGATIVE",
            "title": f"{stem} — Explore invalid or missing input (review required)",
            "preconditions": "Identify one invalid or missing input and confirm the applicable validation rule with the product owner.",
            "steps": "1. Prepare an invalid or missing input (candidate only).\n2. Perform the relevant action.\n3. Record the observed behavior for review.",
            "expected_result": "NOT SPECIFIED by the source criterion. Define the expected rejection or handling rule before executing this case.",
            "requires_rule_clarification": True,
        },
    ]
