"""QA-112: validate metadata-only repository-relative Playwright paths.

Never open or execute the value supplied by the client.
"""
import re

_SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9_-][A-Za-z0-9_.-]*$")
_EXTENSIONS = (".spec.ts", ".test.ts", ".spec.js", ".test.js")


def validate_playwright_path(value: str) -> str:
    if not isinstance(value, str) or not (1 <= len(value) <= 300):
        raise ValueError("Script path must be 1..300 characters")
    if "\\" in value or ":" in value or value.startswith("/"):
        raise ValueError("Only repository-relative paths are allowed")
    segments = value.split("/")
    if any(
        part in {"", ".", ".."} or not _SAFE_SEGMENT.fullmatch(part)
        for part in segments
    ):
        raise ValueError("Invalid repository path segment")
    if not value.endswith(_EXTENSIONS):
        raise ValueError("A Playwright .spec.ts/.test.ts/.spec.js/.test.js file is required")
    return value
