"""Validation contracts for Decision Challenger (no implicit authority)."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

ChallengeState = Literal["OPEN_UNQUALIFIED", "QUALIFIED", "RESOLVED", "REJECTED"]
ChallengeSeverity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
DecisionState = Literal["UNDETERMINED", "NO_GO", "REVIEW_REQUIRED"]


class Trimmed(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def normalize(cls, value):
        if isinstance(value, str):
            if "\x00" in value:
                raise ValueError("NUL characters are forbidden")
            return value.strip()
        return value


class ChallengeCreate(Trimmed):
    obligation_id: UUID
    version: str = Field(min_length=1, max_length=80)
    source: str = Field(min_length=1, max_length=120)
    owner: str = Field(min_length=1, max_length=120)
    reason: str = Field(min_length=1, max_length=500)
    severity: ChallengeSeverity
    plausible_harm: str | None = Field(default=None, min_length=1, max_length=500)
    required_evidence: str | None = Field(default=None, min_length=1, max_length=500)


class ChallengeTransition(Trimmed):
    to_status: Literal["QUALIFIED", "RESOLVED", "REJECTED"]
    actor: str = Field(min_length=1, max_length=120)
    justification: str = Field(min_length=1, max_length=500)
    plausible_harm: str | None = Field(default=None, min_length=1, max_length=500)
    required_evidence: str | None = Field(default=None, min_length=1, max_length=500)


class ChallengeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    release_id: UUID
    obligation_id: UUID
    version: str
    source: str
    owner: str
    reason: str
    severity: ChallengeSeverity
    plausible_harm: str | None
    required_evidence: str | None
    status: ChallengeState
    created_at: datetime
    updated_at: datetime


class ChallengeEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    challenge_id: UUID
    from_status: ChallengeState | None
    to_status: ChallengeState
    actor: str
    justification: str
    created_at: datetime


class ChallengerAssessment(BaseModel):
    release_id: UUID
    version: str
    dc01_state: DecisionState
    state: DecisionState
    explanation: str
    qualifying_critical_challenge_ids: list[UUID]
    challenges_total: int
    qualified_open: int
    # A READINESS evaluation never represents a release approval.
