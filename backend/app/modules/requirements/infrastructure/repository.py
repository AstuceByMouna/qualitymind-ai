"""SQLAlchemy implementation of the Requirements persistence port."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.modules.requirements.domain.entities import RequirementEntity


def _to_domain(model: Requirement) -> RequirementEntity:
    return RequirementEntity(
        id=model.id,
        title=model.title,
        description=model.description,
        created_at=model.created_at,
    )


class SqlAlchemyRequirementRepository:
    def __init__(self, db: Session):
        self._db = db

    def create(self, *, title: str, description: str) -> RequirementEntity:
        model = Requirement(title=title, description=description)
        self._db.add(model)
        self._db.commit()
        self._db.refresh(model)
        return _to_domain(model)

    def get(self, requirement_id: UUID) -> RequirementEntity | None:
        model = self._db.get(Requirement, requirement_id)
        return _to_domain(model) if model is not None else None

    def list_page(self, *, limit: int, offset: int) -> tuple[list[RequirementEntity], int]:
        count_stmt = select(func.count()).select_from(Requirement)
        total = self._db.scalar(count_stmt)
        page_stmt = (
            select(Requirement)
            .order_by(Requirement.created_at.desc(), Requirement.id.desc())
            .limit(limit)
            .offset(offset)
        )
        models = self._db.scalars(page_stmt).all()
        return [_to_domain(model) for model in models], int(total or 0)
