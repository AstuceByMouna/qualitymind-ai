"""DC-02: decision objections are evidence for human review, never approval."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.quality_governance import QualityRelease, ReleaseObligation, ReleaseEvidence
from app.models.release_challenge import ReleaseChallenge, ReleaseChallengeEvent
from app.modules.quality_governance.readiness import assess_release
from app.modules.quality_governance.challenger import evaluate_challenger
from app.schemas.release_challenge import (
    ChallengeCreate, ChallengeEventRead, ChallengeRead, ChallengeTransition,
    ChallengerAssessment,
)

router = APIRouter(prefix="/api/v1/releases/{release_id}/challenges", tags=["decision-challenger"])


def _release(db: Session, release_id: UUID) -> QualityRelease:
    release = db.get(QualityRelease, release_id)
    if release is None:
        raise HTTPException(status_code=404, detail="Release not found")
    return release


def _challenge(db: Session, release_id: UUID, challenge_id: UUID, *, lock: bool = False) -> ReleaseChallenge:
    query = select(ReleaseChallenge).where(
        ReleaseChallenge.id == challenge_id, ReleaseChallenge.release_id == release_id,
    )
    if lock:
        query = query.with_for_update()
    item = db.scalar(query)
    if item is None:
        raise HTTPException(status_code=404, detail="Release challenge not found")
    return item


@router.post("", response_model=ChallengeRead, status_code=201)
def create_challenge(release_id: UUID, data: ChallengeCreate, db: Session = Depends(get_db)):
    release = _release(db, release_id)
    obligation = db.get(ReleaseObligation, data.obligation_id)
    if obligation is None or obligation.release_id != release_id:
        raise HTTPException(status_code=422, detail="Choose an obligation of this release")
    if data.version != release.version:
        raise HTTPException(status_code=422, detail="Challenge version must match release")
    item = ReleaseChallenge(
        release_id=release_id, obligation_id=data.obligation_id, version=data.version,
        source=data.source, owner=data.owner, reason=data.reason,
        severity=data.severity, plausible_harm=data.plausible_harm,
        required_evidence=data.required_evidence, status="OPEN_UNQUALIFIED",
    )
    try:
        db.add(item)
        db.flush()
        db.add(ReleaseChallengeEvent(
            challenge_id=item.id, from_status=None, to_status="OPEN_UNQUALIFIED",
            actor=data.owner, justification="Created by source: " + data.source,
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate challenge for this release obligation and version") from exc
    db.refresh(item)
    return item


@router.get("", response_model=list[ChallengeRead])
def list_challenges(
    release_id: UUID, limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    _release(db, release_id)
    return db.scalars(
        select(ReleaseChallenge).where(ReleaseChallenge.release_id == release_id)
        .order_by(ReleaseChallenge.created_at.desc(), ReleaseChallenge.id.desc())
        .limit(limit)
    ).all()


@router.get("/assessment", response_model=ChallengerAssessment)
def get_challenger_assessment(release_id: UUID, db: Session = Depends(get_db)):
    release = _release(db, release_id)
    obligations = db.scalars(
        select(ReleaseObligation).where(ReleaseObligation.release_id == release_id)
        .order_by(ReleaseObligation.created_at, ReleaseObligation.id)
    ).all()
    latest = {}
    if obligations:
        rows = db.scalars(
            select(ReleaseEvidence).where(
                ReleaseEvidence.obligation_id.in_([o.id for o in obligations])
            ).order_by(ReleaseEvidence.created_at.desc(), ReleaseEvidence.id.desc())
        ).all()
        for evidence in rows:
            latest.setdefault(str(evidence.obligation_id), {
                "tested_version": evidence.tested_version,
                "result": evidence.result,
            })
    base = assess_release(
        release.version,
        [
            {
                "id": o.id, "requirement_id": o.requirement_id,
                "title": o.title, "critical": o.critical,
            } for o in obligations
        ], latest,
    )
    challenges = db.scalars(
        select(ReleaseChallenge).where(ReleaseChallenge.release_id == release_id)
    ).all()
    decision = evaluate_challenger(
        base["state"], release.version,
        [
            {
                "id": x.id, "version": x.version, "status": x.status,
                "severity": x.severity, "plausible_harm": x.plausible_harm,
                "required_evidence": x.required_evidence,
            } for x in challenges
        ],
    )
    return {
        "release_id": release.id, "version": release.version,
        "dc01_state": base["state"], **decision,
    }


@router.get("/{challenge_id}", response_model=ChallengeRead)
def get_challenge(release_id: UUID, challenge_id: UUID, db: Session = Depends(get_db)):
    _release(db, release_id)
    return _challenge(db, release_id, challenge_id)


@router.post("/{challenge_id}/transitions", response_model=ChallengeRead)
def transition_challenge(
    release_id: UUID, challenge_id: UUID, data: ChallengeTransition,
    db: Session = Depends(get_db),
):
    release = _release(db, release_id)
    item = _challenge(db, release_id, challenge_id, lock=True)
    allowed = {
        "OPEN_UNQUALIFIED": {"QUALIFIED", "REJECTED"},
        "QUALIFIED": {"RESOLVED", "REJECTED"},
        "RESOLVED": set(),
        "REJECTED": set(),
    }
    if data.to_status not in allowed[item.status]:
        raise HTTPException(status_code=409, detail="Invalid challenge status transition")
    if item.version != release.version:
        raise HTTPException(status_code=422, detail="Challenge version is stale")

    if data.to_status == "QUALIFIED":
        harm = data.plausible_harm or item.plausible_harm
        proof = data.required_evidence or item.required_evidence
        if not harm or not proof:
            raise HTTPException(
                status_code=422, detail="Qualification requires plausible harm and required evidence",
            )
        item.plausible_harm, item.required_evidence = harm, proof
    previous = item.status
    item.status = data.to_status
    db.add(ReleaseChallengeEvent(
        challenge_id=item.id, from_status=previous, to_status=data.to_status,
        actor=data.actor, justification=data.justification,
    ))
    db.commit()
    db.refresh(item)
    return item


@router.get("/{challenge_id}/history", response_model=list[ChallengeEventRead])
def challenge_history(release_id: UUID, challenge_id: UUID, db: Session = Depends(get_db)):
    _release(db, release_id)
    _challenge(db, release_id, challenge_id)
    return db.scalars(
        select(ReleaseChallengeEvent).where(ReleaseChallengeEvent.challenge_id == challenge_id)
        .order_by(ReleaseChallengeEvent.created_at, ReleaseChallengeEvent.id)
    ).all()
