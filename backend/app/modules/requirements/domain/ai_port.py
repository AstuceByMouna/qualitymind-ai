"""Hexagonal port: tests can replace the external model with a fake."""
from typing import Protocol
from . import entities  # noqa: F401
from app.modules.requirements.application.ai_contract import AIAnalysisPayload

class AIAnalyzerPort(Protocol):
    def analyze(self, snapshot: dict) -> AIAnalysisPayload: ...
