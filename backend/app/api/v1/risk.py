"""QA-111: explicit risk assessment; factual, non-approved draft counts."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.requirement import Requirement
from app.models.test_case import TestCase
from app.modules.risk_based.policy import draft_state, requires_test_design
from app.schemas.risk import RiskList, RiskRequirement, RiskUpdate

router = APIRouter(prefix="/api/v1/risk", tags=["risk-based-testing"])


@router.get("/requirements", response_model=RiskList)
def list_requirement_risks(
    limit: int = Query(default=200, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List active requirements. UNKNOWN is not treated as low risk."""
    counts = (
        select(TestCase.requirement_id, func.count(TestCase.id).label("draft_count"))
        .group_by(TestCase.requirement_id)
        .subquery()
    )
    sort_order = case(
        (Requirement.risk_level == "HIGH", 0),
        (Requirement.risk_level == "MEDIUM", 1),
        (Requirement.risk_level == "LOW", 2),
        else_=3,
    )
    total = db.scalar(
        select(func.count(Requirement.id)).where(Requirement.archived_at.is_(None))
    ) or 0
    query = (
        select(
            Requirement.id, Requirement.title, Requirement.risk_level,
            func.coalesce(counts.c.draft_count, 0),
        )
        .outerjoin(counts, counts.c.requirement_id == Requirement.id)
        .where(Requirement.archived_at.is_(None))
        .order_by(sort_order, Requirement.created_at.desc(), Requirement.id)
        .limit(limit)
        .offset(offset)
    )
    items = [
        RiskRequirement(
            id=rid, title=title, risk_level=level, draft_count=int(drafts),
            test_design_status=draft_state(int(drafts)),
            needs_test_design=requires_test_design(level, int(drafts)),
        )
        for rid, title, level, drafts in db.execute(query).all()
    ]
    return RiskList(items=items, total=total, limit=limit, offset=offset)


@router.patch("/requirements/{requirement_id}/risk", response_model=RiskRequirement)
def update_risk(requirement_id: UUID, data: RiskUpdate, db: Session = Depends(get_db)):
    req = db.get(Requirement, requirement_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    if req.archived_at is not None:
        raise HTTPException(status_code=409, detail="Archived requirement cannot be reassessed")
    req.risk_level = data.risk_level
    db.commit()
    db.refresh(req)
    drafts = db.scalar(
        select(func.count(TestCase.id)).where(TestCase.requirement_id == req.id)
    ) or 0
    return RiskRequirement(
        id=req.id, title=req.title, risk_level=req.risk_level,
        draft_count=drafts, test_design_status=draft_state(drafts),
        needs_test_design=requires_test_design(req.risk_level, drafts),
    )
