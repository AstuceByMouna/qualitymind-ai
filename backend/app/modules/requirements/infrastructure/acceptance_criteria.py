"""PostgreSQL adapter for acceptance criteria, scoped to their requirement."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.models.acceptance_criterion import AcceptanceCriterion
from app.modules.requirements.domain.acceptance_criteria import AcceptanceCriterionEntity


def _to_domain(model: AcceptanceCriterion) -> AcceptanceCriterionEntity:
    return AcceptanceCriterionEntity(
        id=model.id,
        requirement_id=model.requirement_id,
        content=model.content,
        position=model.position,
        created_at=model.created_at,
    )


class SqlAlchemyAcceptanceCriteriaRepository:
    def __init__(self, db: Session):
        self._db = db

    def _lock_parent(self, requirement_id: UUID) -> bool:
        # Serialize additions/removals of criteria belonging to the same requirement.
        return self._db.scalar(
            select(Requirement.id)
            .where(Requirement.id == requirement_id)
            .with_for_update()
        ) is not None

    def list_for_requirement(
        self, requirement_id: UUID,
    ) -> list[AcceptanceCriterionEntity] | None:
        if self._db.get(Requirement, requirement_id) is None:
            return None
        rows = self._db.scalars(
            select(AcceptanceCriterion)
            .where(AcceptanceCriterion.requirement_id == requirement_id)
            .order_by(AcceptanceCriterion.position, AcceptanceCriterion.id)
        ).all()
        return [_to_domain(item) for item in rows]

    def add(
        self, requirement_id: UUID, *, content: str,
    ) -> AcceptanceCriterionEntity | None:
        if not self._lock_parent(requirement_id):
            return None
        position = self._db.scalar(
            select(func.coalesce(func.max(AcceptanceCriterion.position), 0))
            .where(AcceptanceCriterion.requirement_id == requirement_id)
        )
        item = AcceptanceCriterion(
            requirement_id=requirement_id,
            content=content,
            position=int(position or 0) + 1,
        )
        self._db.add(item)
        self._db.commit()
        self._db.refresh(item)
        return _to_domain(item)

    def update(
        self, requirement_id: UUID, criterion_id: UUID, *, content: str,
    ) -> AcceptanceCriterionEntity | None:
        if self._db.get(Requirement, requirement_id) is None:
            return None
        item = self._db.get(AcceptanceCriterion, criterion_id)
        if item is None or item.requirement_id != requirement_id:
            return None
        item.content = content
        self._db.commit()
        self._db.refresh(item)
        return _to_domain(item)

    def remove(self, requirement_id: UUID, criterion_id: UUID) -> bool:
        if not self._lock_parent(requirement_id):
            return False
        item = self._db.get(AcceptanceCriterion, criterion_id)
        if item is None or item.requirement_id != requirement_id:
            return False
        self._db.delete(item)
        self._db.flush()
        # Keep stable, contiguous display positions after a deletion.
        remaining = self._db.scalars(
            select(AcceptanceCriterion)
            .where(AcceptanceCriterion.requirement_id == requirement_id)
            .order_by(AcceptanceCriterion.position, AcceptanceCriterion.id)
        ).all()
        for index, criterion in enumerate(remaining, start=1):
            criterion.position = index
        self._db.commit()
        return True
