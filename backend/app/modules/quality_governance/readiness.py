"""Pure, deterministic policy: never issue GO without human authority.

Only latest evidence per obligation is assessed. Missing/stale evidence cannot
silently become PASS. Critical failures block; completed checks need review.
"""
from collections.abc import Mapping
from typing import Any


def assess_release(version: str, obligations: list[dict[str, Any]], latest: Mapping[str, dict[str, str]]) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    critical_failed = False
    unknown = not obligations

    for obligation in obligations:
        evidence = latest.get(str(obligation["id"]))
        if evidence is None:
            status = "MISSING"
        elif evidence["tested_version"] != version:
            status = "STALE"
        else:
            status = evidence["result"]
        if status in ("MISSING", "STALE"):
            unknown = True
        if status == "FAIL" and obligation["critical"]:
            critical_failed = True
        rows.append({**obligation, "evidence_status": status})

    if critical_failed:
        state, explanation = "NO_GO", "At least one critical obligation has failing evidence."
    elif unknown:
        state, explanation = "UNDETERMINED", "Evidence is missing, stale, or no obligations have been defined."
    else:
        state, explanation = "REVIEW_REQUIRED", "Checks are recorded; human review is required. This is not a GO approval."

    return {"state": state, "explanation": explanation, "obligations": rows}
