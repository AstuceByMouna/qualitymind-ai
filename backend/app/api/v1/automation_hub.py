"""QA-112: Playwright script association without script execution."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.requirement import Requirement
from app.models.test_case import TestCase
from app.schemas.automation_hub import PlaywrightAssociationRead, PlaywrightAssociationUpdate

router = APIRouter(prefix="/api/v1/test-cases", tags=["automation-hub"])


def _lookup(db: Session, test_case_id: UUID) -> tuple[TestCase, Requirement]:
    case = db.get(TestCase, test_case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    req = db.get(Requirement, case.requirement_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return case, req


def _read(case: TestCase) -> PlaywrightAssociationRead:
    return PlaywrightAssociationRead(
        test_case_id=case.id,
        requirement_id=case.requirement_id,
        playwright_script_path=case.playwright_script_path,
    )


@router.get("/{test_case_id}/automation", response_model=PlaywrightAssociationRead)
def read_automation(test_case_id: UUID, db: Session = Depends(get_db)):
    case, _ = _lookup(db, test_case_id)
    return _read(case)


@router.patch("/{test_case_id}/automation", response_model=PlaywrightAssociationRead)
def associate_playwright(
    test_case_id: UUID,
    data: PlaywrightAssociationUpdate,
    db: Session = Depends(get_db),
):
    case, requirement = _lookup(db, test_case_id)
    if requirement.archived_at is not None:
        raise HTTPException(status_code=409, detail="Archived requirements cannot be changed")
    # Only a metadata reference. Never read files, contact URLs, or run a script.
    case.playwright_script_path = data.playwright_script_path
    db.commit()
    db.refresh(case)
    return _read(case)
