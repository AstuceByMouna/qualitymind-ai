"""QA-124: deterministic clues, unknown fallback and no log echoes."""
import pytest

from app.modules.failure_analysis.policy import classify_failure


@pytest.mark.parametrize(("sample", "expected"), [
    ("TimeoutError: locator.waitFor: timeout 30000ms exceeded", "TIMEOUT"),
    ("Error: locator not found after navigation", "LOCATOR"),
    ("AssertionError: expected true received false", "ASSERTION"),
    ("HTTP 503 during the synthetic service check", "HTTP"),
    ("The checkout scenario did not finish correctly", "UNKNOWN"),
    ("HTTP 503 and timeout while checking service", "TIMEOUT"),
])
def test_failure_clues(sample, expected):
    category, label, guidance = classify_failure(sample)
    assert category == expected
    assert label
    assert guidance
    assert sample not in label
    assert sample not in guidance


def test_case_insensitive():
    assert classify_failure("LOCATOR NOT FOUND on synthetic checkout")[0] == "LOCATOR"
