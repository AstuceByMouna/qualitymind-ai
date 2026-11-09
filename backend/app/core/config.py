
"""Centralized application configuration."""

import os


def get_cors_origins() -> list[str]:
    """Return the explicitly allowed frontend origins."""
    value = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )

    return [
        origin.strip().rstrip("/")
        for origin in value.split(",")
        if origin.strip()
    ]
