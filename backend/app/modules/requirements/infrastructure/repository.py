"""SQLAlchemy implementation of the Requirements persistence port."""
from uuid import UUID

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.models.requirement import Requirement, RequirementStatusHistory
from app.modules.requirements.domain.entities import RequirementEntity


def _to_domain(model: Requirement) -> RequirementEntity:
    return RequirementEntity(
        id=model.id,
        title=model.title,
        description=model.description,
        created_at=model.created_at,
        status=model.status,
        archived_at=model.archived_at,
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

    def update(
        self, requirement_id: UUID, *, title: str | None, description: str | None
    ) -> RequirementEntity | None:
        model = self._db.get(Requirement, requirement_id)
        if model is None:
            return None

        if title is not None:
            model.title = title
        if description is not None:
            model.description = description

        self._db.commit()
        self._db.refresh(model)
        return _to_domain(model)

    def transition(self, requirement_id: UUID, *, target_status: str, allowed_from: frozenset[str]) -> RequirementEntity | None:
        model = self._db.scalar(
            select(Requirement).where(Requirement.id == requirement_id).with_for_update()
        )
        if model is None:
            return None
        if model.status not in allowed_from:
            from app.modules.requirements.application.lifecycle import TransitionConflictError
            raise TransitionConflictError(f"Cannot transition from {model.status} to {target_status}")
        original = model.status
        model.status = target_status
        self._db.add(RequirementStatusHistory(
            requirement_id=requirement_id, from_status=original, to_status=target_status, source="api"
        ))
        self._db.commit()
        self._db.refresh(model)
        return _to_domain(model)

    def history(self, requirement_id: UUID) -> list[RequirementStatusHistory] | None:
        if self._db.get(Requirement, requirement_id) is None:
            return None
        return list(self._db.scalars(
            select(RequirementStatusHistory)
            .where(RequirementStatusHistory.requirement_id == requirement_id)
            .order_by(RequirementStatusHistory.changed_at, RequirementStatusHistory.id)
        ).all())

    def set_archived(self, requirement_id: UUID, *, archived: bool) -> RequirementEntity | None:
        model = self._db.scalar(select(Requirement).where(Requirement.id == requirement_id).with_for_update())
        if model is None:
            return None
        if archived and model.archived_at is None:
            model.archived_at = self._db.scalar(select(func.now()))
            model.archive_source = "api"
        elif not archived and model.archived_at is not None:
            model.archived_at = None
            model.archive_source = None
        self._db.commit()
        self._db.refresh(model)
        return _to_domain(model)

    def list_page(
        self, *, limit: int, offset: int, query: str | None = None, archived: bool = False
    ) -> tuple[list[RequirementEntity], int]:
        # Match the previous local UI behavior: title, description and UUID.
        # Escape LIKE metacharacters so %, _ and backslash are literal,
        # not SQL wildcards. SQLAlchemy binds the resulting pattern safely.
        filters = [Requirement.archived_at.is_not(None) if archived else Requirement.archived_at.is_(None)]
        if query and query.strip():
            escaped = (
                query.strip().replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")
            )
            pattern = f"%{escaped}%"
            filters.append(or_(
                Requirement.title.ilike(pattern, escape="\\"),
                Requirement.description.ilike(pattern, escape="\\"),
                cast(Requirement.id, String).ilike(pattern, escape="\\"),
            ))

        count_stmt = select(func.count()).select_from(Requirement).where(*filters)
        total = self._db.scalar(count_stmt)
        page_stmt = (
            select(Requirement)
            .where(*filters)
            .order_by(Requirement.created_at.desc(), Requirement.id.desc())
            .limit(limit)
            .offset(offset)
        )
        models = self._db.scalars(page_stmt).all()
        return [_to_domain(model) for model in models], int(total or 0)
