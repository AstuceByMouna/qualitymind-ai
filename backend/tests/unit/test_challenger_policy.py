"""QA-103 reference decisions: baseline fixed before backend implementation."""
from uuid import UUID

import pytest

from app.modules.quality_governance.challenger import evaluate_challenger

CID = UUID("00000000-0000-4000-8000-000000000071")


def challenge(status="OPEN_UNQUALIFIED", severity="CRITICAL", version="2026.11.19",
              harm="Could omit a mandatory control", proof="Review linked run"):
    return {
        "id": CID, "version": version, "status": status,
        "severity": severity, "plausible_harm": harm,
        "required_evidence": proof,
    }


@pytest.mark.parametrize(
    "scenario,baseline,challenges,expected",
    [
        ("DC02-01", "REVIEW_REQUIRED", [], "REVIEW_REQUIRED"),
        ("DC02-02", "REVIEW_REQUIRED", [challenge()], "REVIEW_REQUIRED"),
        ("DC02-03", "REVIEW_REQUIRED", [challenge("QUALIFIED")], "NO_GO"),
        ("DC02-04", "REVIEW_REQUIRED", [challenge("QUALIFIED", "HIGH")], "REVIEW_REQUIRED"),
        ("DC02-05", "REVIEW_REQUIRED", [challenge("RESOLVED")], "REVIEW_REQUIRED"),
        ("DC02-06", "REVIEW_REQUIRED", [challenge("REJECTED")], "REVIEW_REQUIRED"),
        ("DC02-07", "NO_GO", [challenge("RESOLVED")], "NO_GO"),
        ("DC02-08", "UNDETERMINED", [challenge("QUALIFIED", "HIGH")], "UNDETERMINED"),
    ],
)
def test_reference_policy(scenario, baseline, challenges, expected):
    result = evaluate_challenger(baseline, "2026.11.19", challenges)
    assert result["state"] == expected, scenario
    assert result["state"] != "GO"


def test_stale_critical_does_not_override_baseline():
    assert evaluate_challenger(
        "REVIEW_REQUIRED", "2026.11.19", [challenge("QUALIFIED", version="2026.11.18")]
    )["state"] == "REVIEW_REQUIRED"


def test_incomplete_claim_does_not_block_without_qualification():
    assert evaluate_challenger(
        "REVIEW_REQUIRED", "2026.11.19", [challenge("QUALIFIED", harm=None)]
    )["state"] == "REVIEW_REQUIRED"


def test_unknown_baseline_is_not_approved():
    with pytest.raises(ValueError):
        evaluate_challenger("GO", "2026.11.19", [])
