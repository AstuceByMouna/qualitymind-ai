"""FR-007 deterministic lifecycle transition policy."""

ALLOWED_FROM: dict[str, frozenset[str]] = {
    "Draft": frozenset({"In Review", "Ready"}),
    "In Review": frozenset({"Draft"}),
    "Ready": frozenset({"In Review"}),
}

class TransitionConflictError(Exception):
    """Business state conflict."""
