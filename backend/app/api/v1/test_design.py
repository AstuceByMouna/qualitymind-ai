"""QA-107 test-case proposal/creation API. User chooses what to persist."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.requirement import Requirement
from app.models.acceptance_criterion import AcceptanceCriterion
from app.models.test_case import TestCase
from app.modules.test_design.suggestions import propose
from app.schemas.test_case import TestCaseCreate, TestCaseRead, TestSuggestion

router = APIRouter(prefix="/api/v1/requirements/{requirement_id}/test-cases", tags=["test-design"])


def _requirement(db: Session, requirement_id: UUID) -> Requirement:
    req = db.get(Requirement, requirement_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return req


def _criteria(db: Session, requirement_id: UUID) -> list[AcceptanceCriterion]:
    return list(db.scalars(
        select(AcceptanceCriterion).where(AcceptanceCriterion.requirement_id == requirement_id)
        .order_by(AcceptanceCriterion.position, AcceptanceCriterion.id)
    ).all())


@router.get("/suggestions", response_model=list[TestSuggestion])
def suggestions(requirement_id: UUID, db: Session = Depends(get_db)):
    req = _requirement(db, requirement_id)
    if req.archived_at is not None:
        return []
    return [suggestion for criterion in _criteria(db, requirement_id)
            for suggestion in propose(criterion.id, criterion.content, criterion.position)]


@router.get("", response_model=list[TestCaseRead])
def list_cases(requirement_id: UUID, limit: int = Query(default=100, ge=1, le=200),
               db: Session = Depends(get_db)):
    _requirement(db, requirement_id)
    return db.scalars(select(TestCase).where(TestCase.requirement_id == requirement_id)
                      .order_by(TestCase.created_at, TestCase.id).limit(limit)).all()


@router.post("", response_model=TestCaseRead, status_code=201)
def save_draft(requirement_id: UUID, data: TestCaseCreate, db: Session = Depends(get_db)):
    req = _requirement(db, requirement_id)
    if req.archived_at is not None:
        raise HTTPException(status_code=409, detail="Archived requirements cannot receive new tests")
    criterion = db.get(AcceptanceCriterion, data.criterion_id)
    if criterion is None or criterion.requirement_id != requirement_id:
        raise HTTPException(status_code=422, detail="Criterion must belong to requirement")
    candidate = next(x for x in propose(criterion.id, criterion.content, criterion.position)
                     if x["kind"] == data.kind)
    case = TestCase(requirement_id=requirement_id, **candidate)
    try:
        db.add(case)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Draft already saved for this criterion and kind") from exc
    db.refresh(case)
    return case
