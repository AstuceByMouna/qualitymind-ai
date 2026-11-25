"""Strict, traceable test-design contracts."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TestSuggestion(BaseModel):
    criterion_id: UUID
    source_criterion: str
    kind: Literal["POSITIVE", "NEGATIVE"]
    title: str
    preconditions: str
    steps: str
    expected_result: str
    requires_rule_clarification: bool


class TestCaseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    criterion_id: UUID
    kind: Literal["POSITIVE", "NEGATIVE"]


class TestCaseRead(TestSuggestion):
    model_config = ConfigDict(from_attributes=True)
    # Preserve draft snapshots even after their source criterion is deleted.
    criterion_id: UUID | None
    id: UUID
    requirement_id: UUID
    status: Literal["DRAFT"]
    generator_version: str
    created_at: datetime
