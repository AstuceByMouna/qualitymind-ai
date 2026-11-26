"""Risk-Based Testing MVP — explicit human risk, drafts are not approved."""
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

RiskLevel = Literal["UNKNOWN", "LOW", "MEDIUM", "HIGH"]
DraftState = Literal["NO_DRAFT", "DRAFT_ONLY"]


class RiskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    risk_level: RiskLevel


class RiskRequirement(BaseModel):
    id: UUID
    title: str
    risk_level: RiskLevel
    draft_count: int = Field(ge=0)
    test_design_status: DraftState
    needs_test_design: bool


class RiskList(BaseModel):
    items: list[RiskRequirement]
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=200)
    offset: int = Field(ge=0)
