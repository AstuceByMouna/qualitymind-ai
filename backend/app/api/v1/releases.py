"""Versioned HTTP endpoints for governance; no GO/approval endpoint exists."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.quality_governance import QualityRelease, ReleaseEvidence, ReleaseObligation
from app.models.requirement import Requirement
from app.modules.quality_governance.readiness import assess_release
from app.schemas.quality_governance import (
    EvidenceCreate, EvidenceRead, ObligationCreate, ObligationRead,
    ReadinessRead, ReleaseCreate, ReleaseRead,
)

router = APIRouter(prefix="/api/v1/releases", tags=["quality-governance"])


def _release(db: Session, release_id: UUID) -> QualityRelease:
    item = db.get(QualityRelease, release_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Release not found")
    return item


@router.post("", response_model=ReleaseRead, status_code=201)
def create_release(data: ReleaseCreate, db: Session = Depends(get_db)):
    item = QualityRelease(name=data.name, version=data.version)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[ReleaseRead])
def list_releases(limit: int = Query(default=50, ge=1, le=100), db: Session = Depends(get_db)):
    return db.scalars(select(QualityRelease).order_by(QualityRelease.created_at.desc(), QualityRelease.id.desc()).limit(limit)).all()


@router.get("/{release_id}", response_model=ReleaseRead)
def get_release(release_id: UUID, db: Session = Depends(get_db)):
    return _release(db, release_id)


@router.post("/{release_id}/obligations", response_model=ObligationRead, status_code=201)
def add_obligation(release_id: UUID, data: ObligationCreate, db: Session = Depends(get_db)):
    _release(db, release_id)
    requirement = db.get(Requirement, data.requirement_id)
    if requirement is None or requirement.archived_at is not None:
        raise HTTPException(status_code=422, detail="Choose an active requirement")
    item = ReleaseObligation(
        release_id=release_id, requirement_id=data.requirement_id,
        title=data.title, critical=data.critical,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/{release_id}/obligations/{obligation_id}/evidence", response_model=EvidenceRead, status_code=201)
def add_evidence(release_id: UUID, obligation_id: UUID, data: EvidenceCreate, db: Session = Depends(get_db)):
    _release(db, release_id)
    obligation = db.get(ReleaseObligation, obligation_id)
    if obligation is None or obligation.release_id != release_id:
        raise HTTPException(status_code=404, detail="Release obligation not found")
    item = ReleaseEvidence(
        obligation_id=obligation_id, reference=data.reference,
        tested_version=data.tested_version, result=data.result,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{release_id}/readiness", response_model=ReadinessRead)
def get_readiness(release_id: UUID, db: Session = Depends(get_db)):
    release = _release(db, release_id)
    obligations = db.scalars(
        select(ReleaseObligation).where(ReleaseObligation.release_id == release_id)
        .order_by(ReleaseObligation.created_at, ReleaseObligation.id)
    ).all()
    latest: dict[str, dict[str, str]] = {}
    if obligations:
        evidence_rows = db.scalars(
            select(ReleaseEvidence).where(
                ReleaseEvidence.obligation_id.in_([item.id for item in obligations])
            ).order_by(ReleaseEvidence.created_at.desc(), ReleaseEvidence.id.desc())
        ).all()
        for evidence in evidence_rows:
            latest.setdefault(str(evidence.obligation_id), {
                "tested_version": evidence.tested_version, "result": evidence.result,
            })

    rows = [
        {"id": item.id, "requirement_id": item.requirement_id,
         "title": item.title, "critical": item.critical}
        for item in obligations
    ]
    assessment = assess_release(release.version, rows, latest)
    return {"release_id": release.id, "version": release.version, **assessment}
