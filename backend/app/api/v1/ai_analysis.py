"""QA-90: explicitly approved, bounded OpenAI analysis and human decisions."""
import os
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from openai import APIConnectionError, APITimeoutError, RateLimitError, APIStatusError
from pydantic import ValidationError
from app.db import get_db
from app.models.ai_analysis import AIAnalysisRun, AISuggestion
from app.models.requirement import Requirement
from app.models.acceptance_criterion import AcceptanceCriterion
from app.modules.requirements.application.ai_contract import PROMPT_VERSION, DEFAULT_MODEL, source_snapshot, source_digest
from app.modules.requirements.application.ai_privacy import appears_sensitive, exceeds_remote_limit
from app.modules.requirements.infrastructure.openai_analyzer import OpenAIAnalyzer, AIInvalidOutput
from app.schemas.ai_analysis import AIAnalysisRequest, ReviewDecision, RunRead

router = APIRouter(prefix="/api/v1/requirements", tags=["AI requirements review"])
MAX_PERSISTED_SUGGESTIONS = 10

def _read_source(db: Session, requirement_id: UUID):
    requirement = db.get(Requirement, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    criteria = list(db.scalars(select(AcceptanceCriterion.content).where(
        AcceptanceCriterion.requirement_id == requirement_id
    ).order_by(AcceptanceCriterion.position)).all())
    return requirement, source_snapshot(requirement.title, requirement.description, criteria)

def _analyzer():
    return OpenAIAnalyzer()

def _serialize(db: Session, run: AIAnalysisRun) -> RunRead:
    _, snap = _read_source(db, run.requirement_id)
    suggestions = list(db.scalars(select(AISuggestion).where(
        AISuggestion.run_id == run.id
    ).order_by(AISuggestion.id)).all())
    return RunRead(
        id=run.id, requirement_id=run.requirement_id,
        source_digest=run.source_digest, model=run.model,
        prompt_version=run.prompt_version, state=run.state,
        error_code=run.error_code, created_at=run.created_at,
        finished_at=run.finished_at, suggestions=suggestions,
        stale=source_digest(snap)!=run.source_digest,
    )

@router.post("/{requirement_id}/ai-analysis", response_model=RunRead, status_code=201,
    responses={403: {"description":"Explicit authorization required"}, 422: {"description":"Unsuitable input"},
               503: {"description":"AI not configured or temporarily unavailable"}})
def analyze_with_ai(requirement_id: UUID, data: AIAnalysisRequest, db: Session=Depends(get_db)):
    requirement, snapshot = _read_source(db, requirement_id)
    if requirement.archived_at is not None:
        raise HTTPException(status_code=409, detail="Archived requirements cannot be analyzed remotely")
    if not requirement.import_source or not requirement.external_id:
        raise HTTPException(status_code=409, detail="AI analysis in this MVP requires an imported requirement with provenance")
    if appears_sensitive(snapshot):
        raise HTTPException(status_code=422, detail="Possible sensitive data detected; remote processing blocked")
    if exceeds_remote_limit(snapshot):
        raise HTTPException(status_code=413, detail="Requirement exceeds external processing limit")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OpenAI is not configured")
    model=os.getenv("OPENAI_MODEL", DEFAULT_MODEL)
    run=AIAnalysisRun(requirement_id=requirement_id,
        source_digest=source_digest(snapshot), model=model,
        prompt_version=PROMPT_VERSION, state="processing")
    db.add(run);db.commit();db.refresh(run)
    try:
        # The port is mockable; the requirement data is always treated as untrusted input.
        results = _analyzer().analyze(snapshot)
        if len(results.suggestions)>MAX_PERSISTED_SUGGESTIONS:
            raise AIInvalidOutput("Too many suggestions")
        for suggestion in results.suggestions:
            db.add(AISuggestion(run_id=run.id, **suggestion.model_dump()))
        run.state="completed"
        run.finished_at=datetime.now(timezone.utc)
        db.commit();db.refresh(run)
    except (RateLimitError, APITimeoutError, APIConnectionError, APIStatusError,
            ValidationError, AIInvalidOutput, ValueError) as exc:
        db.rollback()
        record=db.get(AIAnalysisRun,run.id)
        record.state="failed"
        record.error_code=("rate_limited" if isinstance(exc, RateLimitError) else
                           "timeout" if isinstance(exc, APITimeoutError) else
                           "invalid_output" if isinstance(exc, (ValidationError,AIInvalidOutput,ValueError)) else "provider_unavailable")
        record.finished_at=datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=503, detail="AI analysis unavailable; no changes made to the requirement") from None
    return _serialize(db,run)

@router.get("/{requirement_id}/ai-analysis",response_model=list[RunRead])
def list_ai_analyses(requirement_id:UUID,db:Session=Depends(get_db)):
    _read_source(db,requirement_id)
    runs=db.scalars(select(AIAnalysisRun).where(
        AIAnalysisRun.requirement_id==requirement_id
    ).order_by(AIAnalysisRun.created_at.desc()).limit(20)).all()
    return [_serialize(db,run) for run in runs]

@router.post("/{requirement_id}/ai-analysis/{run_id}/suggestions/{suggestion_id}/review",
    response_model=RunRead)
def review_suggestion(requirement_id: UUID,run_id:UUID,suggestion_id:UUID,
                      payload:ReviewDecision,db:Session=Depends(get_db)):
    requirement,snapshot=_read_source(db,requirement_id)
    run=db.scalar(select(AIAnalysisRun).where(
        AIAnalysisRun.id==run_id,AIAnalysisRun.requirement_id==requirement_id).with_for_update())
    if run is None: raise HTTPException(status_code=404,detail="Analysis not found")
    if run.state!="completed":
        raise HTTPException(status_code=409,detail="Analysis is not complete")
    if run.source_digest!=source_digest(snapshot):
        raise HTTPException(status_code=409,detail="Requirement changed since analysis; run a new analysis")
    suggestion=db.scalar(select(AISuggestion).where(
        AISuggestion.id==suggestion_id,AISuggestion.run_id==run_id).with_for_update())
    if suggestion is None: raise HTTPException(status_code=404,detail="Suggestion not found")
    if suggestion.decision!="pending":
        raise HTTPException(status_code=409,detail="Suggestion has already been reviewed")
    suggestion.decision=payload.decision
    suggestion.edited_recommendation=payload.edited_recommendation
    suggestion.review_note=payload.note
    suggestion.reviewed_at=datetime.now(timezone.utc)
    db.commit();db.refresh(run)
    return _serialize(db,run)
