"""QA-124: bounded, strict contract for untrusted synthetic failure excerpts."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FailureAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    excerpt: str = Field(min_length=10, max_length=2000)

    @field_validator("excerpt")
    @classmethod
    def require_visible_text(cls, text: str) -> str:
        if not text.strip() or any(ord(char) < 32 and char not in "\n\r\t" for char in text):
            raise ValueError("Provide a readable excerpt without control characters")
        return text


class FailureAnalysisResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    classification: Literal["TIMEOUT", "LOCATOR", "ASSERTION", "HTTP", "UNKNOWN"]
    indicator: str
    suggested_next_step: str
    confidence: Literal["HEURISTIC"] = "HEURISTIC"
    review_required: Literal[True] = True
    execution_status: Literal["NOT_EXECUTED"] = "NOT_EXECUTED"
