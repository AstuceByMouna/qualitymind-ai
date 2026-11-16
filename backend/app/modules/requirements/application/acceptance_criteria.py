"""Acceptance-criteria use cases; framework independent."""
from uuid import UUID

from app.modules.requirements.domain.acceptance_criteria import (
    AcceptanceCriterionEntity,
    AcceptanceCriteriaRepositoryPort,
)


class AcceptanceRequirementNotFoundError(Exception):
    pass


class AcceptanceCriterionNotFoundError(Exception):
    pass


class AcceptanceCriteriaService:
    def __init__(self, repository: AcceptanceCriteriaRepositoryPort):
        self._repository = repository

    def list(self, requirement_id: UUID) -> list[AcceptanceCriterionEntity]:
        result = self._repository.list_for_requirement(requirement_id)
        if result is None:
            raise AcceptanceRequirementNotFoundError("Requirement not found")
        return result

    def add(self, requirement_id: UUID, *, content: str) -> AcceptanceCriterionEntity:
        result = self._repository.add(requirement_id, content=content)
        if result is None:
            raise AcceptanceRequirementNotFoundError("Requirement not found")
        return result

    def update(
        self, requirement_id: UUID, criterion_id: UUID, *, content: str,
    ) -> AcceptanceCriterionEntity:
        result = self._repository.update(requirement_id, criterion_id, content=content)
        if result is None:
            raise AcceptanceCriterionNotFoundError("Acceptance criterion not found")
        return result

    def remove(self, requirement_id: UUID, criterion_id: UUID) -> None:
        if not self._repository.remove(requirement_id, criterion_id):
            raise AcceptanceCriterionNotFoundError("Acceptance criterion not found")
