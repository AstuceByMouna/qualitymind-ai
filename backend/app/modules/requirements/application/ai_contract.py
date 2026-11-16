"""Structured output contract and source fingerprint for QA-90."""
import hashlib
import json
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

PROMPT_VERSION = "qa90-requirement-review-v1"
DEFAULT_MODEL = "gpt-6-luna"

class AISuggestionPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    category: Literal["ambiguity", "gap", "acceptance-criteria", "duplicate-risk", "test-case", "risk"]
    observation: str = Field(min_length=1, max_length=600)
    rationale: str = Field(min_length=1, max_length=1200)
    recommendation: str = Field(min_length=1, max_length=1500)
    suggested_test_case: str | None = Field(max_length=1500)
    risk_level: Literal["low", "medium", "high"]

class AIAnalysisPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    suggestions: list[AISuggestionPayload] = Field(max_length=10)

def source_snapshot(title: str, description: str, criteria: list[str]) -> dict:
    return {"title": title, "description": description, "acceptance_criteria": list(criteria)}

def source_digest(snapshot: dict) -> str:
    serialized = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
