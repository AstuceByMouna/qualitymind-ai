"""Unit tests of Pydantic requirement normalization (QA-63)."""

import pytest
from pydantic import ValidationError

from app.schemas.requirement import RequirementCreate


def test_title_rejects_null_character():
    """NUL characters must be rejected before database access."""
    with pytest.raises(ValidationError):
        RequirementCreate(
            title="Requirement\x00invalid",
            description="Valid description",
        )


def test_title_length_checked_after_trimming():
    """A 255-character title remains valid after trimming."""
    requirement = RequirementCreate(
        title="  " + "A" * 255 + "  ",
        description="Valid description",
    )

    assert requirement.title == "A" * 255


def test_title_rejects_more_than_255_characters():
    """Normalized titles must not exceed database constraints."""
    with pytest.raises(ValidationError):
        RequirementCreate(
            title="A" * 256,
            description="Valid description",
        )


def test_description_rejects_excessive_length():
    """Descriptions must have a defined maximum length."""
    with pytest.raises(ValidationError):
        RequirementCreate(
            title="Valid title",
            description="A" * 10001,
        )


def test_valid_requirement_is_accepted():
    """Normal requirements must remain valid."""
    requirement = RequirementCreate(
        title="  Authentication  ",
        description="  User can log in  ",
    )

    assert requirement.title == "Authentication"
    assert requirement.description == "User can log in"
