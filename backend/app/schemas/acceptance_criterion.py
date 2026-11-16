"""HTTP contracts for requirement acceptance criteria (FR-005)."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AcceptanceCriterionWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content", mode="before")
    @classmethod
    def normalize_content(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Content must be a string")
        cleaned = value.strip()
        if not cleaned or "\x00" in cleaned:
            raise ValueError("Content cannot be blank or contain NUL characters")
        return cleaned


class AcceptanceCriterionRead(BaseModel):
    id: UUID
    requirement_id: UUID
    content: str
    position: int = Field(ge=1)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AcceptanceCriteriaListResponse(BaseModel):
    items: list[AcceptanceCriterionRead]
