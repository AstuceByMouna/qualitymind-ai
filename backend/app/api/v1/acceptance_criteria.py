"""FR-005 acceptance-criteria API nested under its requirement."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.modules.requirements.application.acceptance_criteria import (
    AcceptanceCriteriaService,
    AcceptanceCriterionNotFoundError,
    AcceptanceRequirementNotFoundError,
)
from app.modules.requirements.infrastructure.acceptance_criteria import (
    SqlAlchemyAcceptanceCriteriaRepository,
)
from app.schemas.acceptance_criterion import (
    AcceptanceCriterionRead,
    AcceptanceCriterionWrite,
    AcceptanceCriteriaListResponse,
)

router = APIRouter(
    prefix="/api/v1/requirements/{requirement_id}/acceptance-criteria",
    tags=["acceptance-criteria"],
)


def _service(db: Session) -> AcceptanceCriteriaService:
    return AcceptanceCriteriaService(SqlAlchemyAcceptanceCriteriaRepository(db))


def _not_found(exc: Exception) -> HTTPException:
    return HTTPException(status_code=404, detail=str(exc))


@router.get("", response_model=AcceptanceCriteriaListResponse, responses={404: {}})
def list_acceptance_criteria(requirement_id: UUID, db: Session = Depends(get_db)):
    try:
        return AcceptanceCriteriaListResponse(items=_service(db).list(requirement_id))
    except AcceptanceRequirementNotFoundError as exc:
        raise _not_found(exc) from exc


@router.post("", response_model=AcceptanceCriterionRead, status_code=201, responses={404: {}})
def add_acceptance_criterion(
    requirement_id: UUID, data: AcceptanceCriterionWrite, db: Session = Depends(get_db),
):
    try:
        return _service(db).add(requirement_id, content=data.content)
    except AcceptanceRequirementNotFoundError as exc:
        raise _not_found(exc) from exc


@router.patch("/{criterion_id}", response_model=AcceptanceCriterionRead, responses={404: {}})
def update_acceptance_criterion(
    requirement_id: UUID, criterion_id: UUID, data: AcceptanceCriterionWrite,
    db: Session = Depends(get_db),
):
    try:
        return _service(db).update(requirement_id, criterion_id, content=data.content)
    except AcceptanceCriterionNotFoundError as exc:
        raise _not_found(exc) from exc


@router.delete("/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT, responses={404: {}})
def delete_acceptance_criterion(
    requirement_id: UUID, criterion_id: UUID, db: Session = Depends(get_db),
):
    try:
        _service(db).remove(requirement_id, criterion_id)
    except AcceptanceCriterionNotFoundError as exc:
        raise _not_found(exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
