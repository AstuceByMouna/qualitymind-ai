"""Strict contract for one external declaration. No logs or artifact fields."""
from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator

from app.modules.automation_hub.policy import validate_playwright_path

MAX_IMPORT_BYTES = 4096
Outcome = Literal["PASS", "FAIL", "SKIPPED", "ERROR"]
ExternalId = Annotated[str, Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")]


class ExecutionImport(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    test_case_id: UUID
    external_run_id: ExternalId
    external_result_id: ExternalId
    script_path: str = Field(min_length=1, max_length=300)
    tested_commit_sha: str = Field(pattern=r"^[a-fA-F0-9]{40}$")
    executed_at: AwareDatetime
    outcome: Outcome

    @field_validator("script_path")
    @classmethod
    def validate_path(cls, value: str) -> str:
        return validate_playwright_path(value)

    @field_validator("tested_commit_sha")
    @classmethod
    def normalized_sha(cls, value: str) -> str:
        return value.lower()

    @field_validator("executed_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)


class ExecutionEvidenceRead(ExecutionImport):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    requirement_id: UUID
    imported_at: AwareDatetime
    provenance: Literal["USER_IMPORTED"]
    definition_fingerprint: str
    context_changed: bool


class ExecutionHistory(BaseModel):
    items: list[ExecutionEvidenceRead]
    next_offset: int | None
