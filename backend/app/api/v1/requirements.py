"""HTTP adapter for Requirements v1."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.modules.requirements.application.service import (
    RequirementNotFoundError,
    RequirementService,
)
from app.modules.requirements.infrastructure.repository import SqlAlchemyRequirementRepository
from app.modules.requirements.application.lifecycle import TransitionConflictError
from app.schemas.requirement import RequirementCreate, RequirementListResponse, RequirementRead, RequirementUpdate, RequirementTransition, RequirementStatusEvent

router = APIRouter(prefix="/api/v1/requirements", tags=["requirements"])


def _service(db: Session) -> RequirementService:
    return RequirementService(SqlAlchemyRequirementRepository(db))


@router.post("", response_model=RequirementRead, status_code=201)
def create_requirement(data: RequirementCreate, db: Session = Depends(get_db)):
    return _service(db).create(title=data.title, description=data.description)


@router.get("", response_model=RequirementListResponse)
def list_requirements(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    q: str = Query(default="", max_length=200, description="Case-insensitive text/UUID filter"),
    db: Session = Depends(get_db),
):
    service = _service(db)
    if q.strip():
        items, total = service.list_page(limit=limit, offset=offset, query=q.strip())
    else:
        # Preserve existing integrations/mocks using the original unfiltered signature.
        items, total = service.list_page(limit=limit, offset=offset)
    return RequirementListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get(
    "/{requirement_id}",
    response_model=RequirementRead,
    responses={404: {"description": "Requirement not found"}},
)
def get_requirement(requirement_id: UUID, db: Session = Depends(get_db)):
    try:
        return _service(db).get(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch(
    "/{requirement_id}",
    response_model=RequirementRead,
    responses={404: {"description": "Requirement not found"}},
)
def update_requirement(
    requirement_id: UUID,
    data: RequirementUpdate,
    db: Session = Depends(get_db),
):
    try:
        return _service(db).update(
            requirement_id, title=data.title, description=data.description
        )
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.post(
    "/{requirement_id}/transitions",
    response_model=RequirementRead,
    responses={404: {"description": "Requirement not found"}, 409: {"description": "Transition forbidden"}},
)
def transition_requirement(
    requirement_id: UUID, data: RequirementTransition, db: Session = Depends(get_db)
):
    try:
        return _service(db).transition(requirement_id, data.status)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except TransitionConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get(
    "/{requirement_id}/transitions",
    response_model=list[RequirementStatusEvent],
    responses={404: {"description": "Requirement not found"}},
)
def requirement_transition_history(requirement_id: UUID, db: Session = Depends(get_db)):
    try:
        return _service(db).history(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
