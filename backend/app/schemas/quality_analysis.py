"""Read-only, explainable requirement-analysis API contract."""
from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class QualityFinding(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rule_id: str
    category: Literal["ambiguity","completeness","testability","acceptance-criteria"]
    observation: str
    rationale: str
    suggestion: str
    evidence: str | None = None
    nature: Literal["deterministic-heuristic"] = "deterministic-heuristic"

class QualityAnalysisResponse(BaseModel):
    requirement_id: UUID
    engine: Literal["rules"] = "rules"
    ruleset_version: str
    analyzed_at: datetime
    findings: list[QualityFinding] = Field(default_factory=list)
    human_review_required: bool = True
