"""Application use cases: no FastAPI or SQLAlchemy dependencies."""
from uuid import UUID

from app.modules.requirements.domain.entities import RequirementEntity
from app.modules.requirements.domain.ports import RequirementRepositoryPort
from app.modules.requirements.application.lifecycle import ALLOWED_FROM, TransitionConflictError


class RequirementNotFoundError(Exception):
    pass


class RequirementService:
    def __init__(self, repository: RequirementRepositoryPort):
        self._repository = repository

    def create(self, *, title: str, description: str) -> RequirementEntity:
        return self._repository.create(title=title, description=description)

    def get(self, requirement_id: UUID) -> RequirementEntity:
        requirement = self._repository.get(requirement_id)
        if requirement is None:
            raise RequirementNotFoundError("Requirement not found")
        return requirement

    def update(
        self, requirement_id: UUID, *, title: str | None, description: str | None
    ) -> RequirementEntity:
        requirement = self._repository.update(
            requirement_id, title=title, description=description
        )
        if requirement is None:
            raise RequirementNotFoundError("Requirement not found")
        return requirement

    def transition(self, requirement_id: UUID, target_status: str) -> RequirementEntity:
        if target_status not in ALLOWED_FROM:
            raise TransitionConflictError("Unsupported target status")
        requirement = self._repository.transition(
            requirement_id, target_status=target_status, allowed_from=ALLOWED_FROM[target_status]
        )
        if requirement is None:
            raise RequirementNotFoundError("Requirement not found")
        return requirement

    def history(self, requirement_id: UUID) -> list[object]:
        result = self._repository.history(requirement_id)
        if result is None:
            raise RequirementNotFoundError("Requirement not found")
        return result

    def list_page(
        self, *, limit: int, offset: int, query: str | None = None
    ) -> tuple[list[RequirementEntity], int]:
        return self._repository.list_page(limit=limit, offset=offset, query=query)
