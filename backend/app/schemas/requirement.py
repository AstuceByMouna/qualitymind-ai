
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID

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
class RequirementRead(RequirementCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}