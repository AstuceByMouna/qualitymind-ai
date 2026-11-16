"""Explicit external processing consent and human QA review API."""
from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

class AIAnalysisRequest(BaseModel):
    model_config=ConfigDict(extra="forbid")
    consent_to_external_processing: Literal[True]
    confirms_no_sensitive_data: Literal[True]

class ReviewDecision(BaseModel):
    model_config=ConfigDict(extra="forbid")
    decision: Literal["accepted", "edited", "rejected"]
    edited_recommendation: str | None = Field(default=None, min_length=1, max_length=1500)
    note: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_edit(self):
        if self.decision=="edited" and not self.edited_recommendation:
            raise ValueError("Edited decision requires replacement recommendation")
        if self.decision!="edited" and self.edited_recommendation is not None:
            raise ValueError("Only edited decisions may supply a replacement")
        return self

class SuggestionRead(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id: UUID
    category: str
    observation: str
    rationale: str
    recommendation: str
    suggested_test_case: str | None
    risk_level: str
    decision: str
    edited_recommendation: str | None
    review_note: str | None
    reviewed_at: datetime | None

class RunRead(BaseModel):
    id: UUID
    requirement_id: UUID
    source_digest: str
    model: str
    prompt_version: str
    state: str
    error_code: str | None
    created_at: datetime
    finished_at: datetime | None
    suggestions: list[SuggestionRead]
    stale: bool
