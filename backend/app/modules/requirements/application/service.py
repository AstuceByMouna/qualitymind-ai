"""Application use cases: no FastAPI or SQLAlchemy dependencies."""
from uuid import UUID

from app.modules.requirements.domain.entities import RequirementEntity
from app.modules.requirements.domain.ports import RequirementRepositoryPort


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

    def list_page(self, *, limit: int, offset: int) -> tuple[list[RequirementEntity], int]:
        return self._repository.list_page(limit=limit, offset=offset)
