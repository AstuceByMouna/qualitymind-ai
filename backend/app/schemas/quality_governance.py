"""Contracts for the initial (non-authorizing) governance workbench."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TrimmedFields(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value):
        if isinstance(value, str):
            if "\x00" in value:
                raise ValueError("NUL characters are not allowed")
            return value.strip()
        return value


class ReleaseCreate(TrimmedFields):
    name: str = Field(min_length=1, max_length=120)
    version: str = Field(min_length=1, max_length=80)


class ReleaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    version: str
    created_at: datetime


class ObligationCreate(TrimmedFields):
    requirement_id: UUID
    title: str = Field(min_length=1, max_length=255)
    critical: bool = True


class ObligationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    release_id: UUID
    requirement_id: UUID
    title: str
    critical: bool
    created_at: datetime


class EvidenceCreate(TrimmedFields):
    reference: str = Field(min_length=1, max_length=500)
    tested_version: str = Field(min_length=1, max_length=80)
    result: Literal["PASS", "FAIL"]


class EvidenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    obligation_id: UUID
    reference: str
    tested_version: str
    result: Literal["PASS", "FAIL"]
    created_at: datetime


class ObligationAssessment(BaseModel):
    id: UUID
    requirement_id: UUID
    title: str
    critical: bool
    evidence_status: Literal["PASS", "FAIL", "MISSING", "STALE"]


class ReadinessRead(BaseModel):
    release_id: UUID
    version: str
    state: Literal["UNDETERMINED", "NO_GO", "REVIEW_REQUIRED"]
    explanation: str
    obligations: list[ObligationAssessment]
