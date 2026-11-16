"""Acceptance criteria domain types: no SQLAlchemy or FastAPI imports."""
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True)
class AcceptanceCriterionEntity:
    id: UUID
    requirement_id: UUID
    content: str
    position: int
    created_at: datetime


class AcceptanceCriteriaRepositoryPort(Protocol):
    def list_for_requirement(
        self, requirement_id: UUID,
    ) -> list[AcceptanceCriterionEntity] | None: ...

    def add(
        self, requirement_id: UUID, *, content: str,
    ) -> AcceptanceCriterionEntity | None: ...

    def update(
        self, requirement_id: UUID, criterion_id: UUID, *, content: str,
    ) -> AcceptanceCriterionEntity | None: ...

    def remove(self, requirement_id: UUID, criterion_id: UUID) -> bool: ...
