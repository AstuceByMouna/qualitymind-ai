"""QA-124: conservative failure log classification without external processing.

Only predefined safe response strings are returned. Logs are never persisted,
executed or sent to an external inference provider.
"""
import re
from typing import Literal

FailureKind = Literal["TIMEOUT", "LOCATOR", "ASSERTION", "HTTP", "UNKNOWN"]

# Explicit precedence makes contradictory samples deterministic.
_PATTERNS: tuple[tuple[FailureKind, re.Pattern[str]], ...] = (
    ("TIMEOUT", re.compile(r"\b(?:timeouterror|timeout|timed\s*out|exceeded\s+.*?\s+ms|deadline exceeded)\b", re.I)),
    ("LOCATOR", re.compile(r"\b(?:locator\s+not\s+found|no\s+such\s+element|element\s+not\s+found|strict\s+mode\s+violation|unable\s+to\s+locate)\b", re.I)),
    ("ASSERTION", re.compile(r"\b(?:assertionerror|expect\s*\(|assert\s+.*?failed|expected\s+.*?\s+received)\b", re.I)),
    ("HTTP", re.compile(r"\b(?:http\s*[45][0-9]{2}|status\s*(?:code\s*)?[:=]?\s*[45][0-9]{2}|response\s+status\s*[45][0-9]{2})\b", re.I)),
)

_GUIDANCE: dict[FailureKind, tuple[str, str]] = {
    "TIMEOUT": ("Timeout indicator", "Inspect timing, environment responsiveness and waiting conditions before changing test timeouts."),
    "LOCATOR": ("Locator indicator", "Inspect element availability, selector stability and page state."),
    "ASSERTION": ("Assertion indicator", "Compare the assertion expectation with the actual behavior and approved requirements."),
    "HTTP": ("HTTP error indicator", "Verify request parameters, test environment and server response using authorized logs."),
    "UNKNOWN": ("Unclassified failure", "Review the anonymized excerpt manually; there is not enough evidence to classify it."),
}


def classify_failure(excerpt: str) -> tuple[FailureKind, str, str]:
    """Return a clue and a human validation action, never a root-cause claim."""
    category: FailureKind = "UNKNOWN"
    for candidate, pattern in _PATTERNS:
        if pattern.search(excerpt):
            category = candidate
            break
    label, next_step = _GUIDANCE[category]
    return category, label, next_step
