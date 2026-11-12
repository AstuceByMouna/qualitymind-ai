"""Automatically classify tests by folder for targeted pytest execution.

Do not move database access into global fixtures; integration tests must
explicitly select the isolated PostgreSQL database before execution.
"""
import pytest


def pytest_collection_modifyitems(items):
    """Apply level markers while keeping test functions free of boilerplate."""
    for item in items:
        levels = {"unit", "api", "integration"}.intersection(item.path.parts)
        if len(levels) != 1:
            raise pytest.UsageError(
                f"Test outside a single level directory: {item.path}"
            )
        item.add_marker(getattr(pytest.mark, next(iter(levels))))
