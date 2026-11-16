"""QA-96 manual, read-only testability analysis."""
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.acceptance_criterion import AcceptanceCriterion
from app.modules.requirements.application.quality_rules import RULESET_VERSION, analyze_requirement
from app.modules.requirements.application.service import RequirementService, RequirementNotFoundError
from app.modules.requirements.infrastructure.repository import SqlAlchemyRequirementRepository
from app.schemas.quality_analysis import QualityAnalysisResponse

router = APIRouter(prefix="/api/v1/requirements", tags=["quality-analysis"])

@router.post("/{requirement_id}/quality-analysis", response_model=QualityAnalysisResponse)
def run_quality_analysis(requirement_id: UUID, db: Session = Depends(get_db)):
    try:
        requirement = RequirementService(SqlAlchemyRequirementRepository(db)).get(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    criteria = db.scalars(
        select(AcceptanceCriterion.content)
        .where(AcceptanceCriterion.requirement_id == requirement_id)
        .order_by(AcceptanceCriterion.position)
    ).all()
    return QualityAnalysisResponse(
        requirement_id=requirement_id,
        ruleset_version=RULESET_VERSION,
        analyzed_at=datetime.now(timezone.utc),
        findings=analyze_requirement(requirement.title, requirement.description, list(criteria)),
    )
