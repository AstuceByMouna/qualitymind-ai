
"""Public HTTP request and response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    field_validator,
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

    model_config = {"from_attributes": True}


class RequirementListResponse(BaseModel):
    items: list[RequirementRead]
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=200)
    offset: int = Field(ge=0)
