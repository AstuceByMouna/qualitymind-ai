"""QA-112: strict metadata-only automation link contracts."""
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.modules.automation_hub.policy import validate_playwright_path


class PlaywrightAssociationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    playwright_script_path: str

    @field_validator("playwright_script_path")
    @classmethod
    def valid_path(cls, path: str) -> str:
        return validate_playwright_path(path)


class PlaywrightAssociationRead(BaseModel):
    test_case_id: UUID
    requirement_id: UUID
    playwright_script_path: str | None
    execution_status: Literal["NOT_EXECUTED"] = "NOT_EXECUTED"
