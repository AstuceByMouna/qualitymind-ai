"""Ports implemented by infrastructure adapters."""
from typing import Protocol

from .entities import RequirementEntity


class RequirementRepositoryPort(Protocol):
    def create(self, *, title: str, description: str) -> RequirementEntity: ...
    def get(self, requirement_id: object) -> RequirementEntity | None: ...
    def list_page(self, *, limit: int, offset: int) -> tuple[list[RequirementEntity], int]: ...
