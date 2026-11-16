
"""Public HTTP request and response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
    ConfigDict,
)


class RequirementCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255,
    )
    description: str = Field(
        min_length=1,
        max_length=10000,
    )

    @field_validator("title", "description", mode="before")
    @classmethod
    def normalize_and_validate(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("This field must be a string")

        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty")

        if "\x00" in value:
            raise ValueError("NUL characters are not allowed")

        return value


class RequirementRead(BaseModel):
    id: UUID
    title: str
    description: str
    created_at: datetime
    status: str
    archived_at: datetime | None = None

    model_config = {"from_attributes": True}


class RequirementListResponse(BaseModel):
    items: list[RequirementRead]
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=200)
    offset: int = Field(ge=0)


class RequirementUpdate(BaseModel):
    """PATCH payload: one or both fields, never an empty or null update."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=10000)

    @field_validator("title", "description", mode="before")
    @classmethod
    def normalize_updated_fields(cls, value: object) -> str:
        # Reuse the create contract: strings only, strip, reject empty and NUL.
        return RequirementCreate.normalize_and_validate(value)

    @model_validator(mode="after")
    def reject_empty_patch(self):
        if self.title is None and self.description is None:
            raise ValueError("PATCH requires title and/or description")
        return self

class RequirementTransition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(min_length=1, max_length=20)

    @field_validator("status")
    @classmethod
    def ensure_supported_status(cls, value: str) -> str:
        if value not in ("Draft", "In Review", "Ready"):
            raise ValueError("Unsupported lifecycle status")
        return value


class RequirementStatusEvent(BaseModel):
    id: UUID
    requirement_id: UUID
    from_status: str
    to_status: str
    changed_at: datetime
    source: str

    model_config = ConfigDict(from_attributes=True)
