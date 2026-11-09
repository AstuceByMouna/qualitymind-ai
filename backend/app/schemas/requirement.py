"""Public HTTP request and response schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class RequirementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)

    @field_validator("title", "description")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
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
