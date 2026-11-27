"""Read-only traceability projection over existing QualityMind records."""
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.acceptance_criterion import AcceptanceCriterionRead
from app.schemas.automation_hub import PlaywrightAssociationRead


class TraceabilityRequirement(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    status: Literal["Draft", "In Review", "Ready"]


class TraceabilityCase(PlaywrightAssociationRead):
    title: str
    status: Literal["DRAFT"]
    criterion_id: UUID | None
    criterion_link: Literal["LINKED", "MISSING", "INCONSISTENT"]


class RequirementTraceability(BaseModel):
    requirement: TraceabilityRequirement
    criteria: list[AcceptanceCriterionRead]
    test_cases: list[TraceabilityCase]
