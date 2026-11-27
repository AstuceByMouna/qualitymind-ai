"""QA-126 read-only requirement traceability endpoint."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.test_case import TestCase
from app.modules.requirements.infrastructure.acceptance_criteria import (
    SqlAlchemyAcceptanceCriteriaRepository,
)
from app.modules.requirements.infrastructure.repository import SqlAlchemyRequirementRepository
from app.schemas.acceptance_criterion import AcceptanceCriterionRead
from app.schemas.traceability import (
    RequirementTraceability,
    TraceabilityCase,
    TraceabilityRequirement,
)

router = APIRouter(prefix="/api/v1/requirements", tags=["traceability"])


@router.get("/{requirement_id}/traceability", response_model=RequirementTraceability)
def read_traceability(requirement_id: UUID, db: Session = Depends(get_db)):
    requirement = SqlAlchemyRequirementRepository(db).get(requirement_id)
    if requirement is None:
        raise HTTPException(404, "Requirement not found")
    if requirement.archived_at is not None:
        raise HTTPException(409, "Requirement is archived")

    criteria = SqlAlchemyAcceptanceCriteriaRepository(db).list_for_requirement(requirement_id)
    if criteria is None:
        raise HTTPException(404, "Requirement not found")
    criterion_ids = {criterion.id for criterion in criteria}
    cases = db.scalars(
        select(TestCase)
        .where(TestCase.requirement_id == requirement_id)
        .order_by(TestCase.created_at, TestCase.id)
    ).all()

    items = []
    for case in cases:
        if case.criterion_id is None:
            link = "MISSING"
        elif case.criterion_id in criterion_ids:
            link = "LINKED"
        else:
            link = "INCONSISTENT"
        items.append(TraceabilityCase(
            test_case_id=case.id,
            requirement_id=case.requirement_id,
            title=case.title,
            status=case.status,
            criterion_id=case.criterion_id,
            criterion_link=link,
            playwright_script_path=case.playwright_script_path,
        ))

    return RequirementTraceability(
        requirement=TraceabilityRequirement.model_validate(requirement),
        criteria=[AcceptanceCriterionRead.model_validate(criterion) for criterion in criteria],
        test_cases=items,
    )
