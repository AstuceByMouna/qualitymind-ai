"""Conservative guardrails before explicitly approved third-party processing."""
import json
import re

# False negatives remain possible. The separate user attestation is mandatory.
PATTERNS = [
    re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"),
    re.compile(r"(?i)\b(?:sk-(?:proj-)?|Bearer\s+)[A-Za-z0-9_-]{12,}\b"),
    re.compile(r"(?i)\b(?:api[_-]?key|password|passwd|secret)\s*[:=]\s*\S+"),
    re.compile(r"\b(?:\d[ -]?){13,19}\b"),
]

def appears_sensitive(snapshot: dict) -> bool:
    text = json.dumps(snapshot, ensure_ascii=False)
    return any(pattern.search(text) for pattern in PATTERNS)

def exceeds_remote_limit(snapshot: dict) -> bool:
    return len(json.dumps(snapshot, ensure_ascii=False)) > 16000
