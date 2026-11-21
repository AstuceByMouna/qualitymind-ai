"""QA-103 DB integration: lifecycle, durable audit, negative cases, no auto-GO.

Guarded to run only on disposable qualitymind_test PostgreSQL.
"""
import os
from uuid import UUID

if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("QA-103 integration test requires POSTGRES_DB=qualitymind_test")

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal, engine
from app.main import app
from app.models.quality_governance import QualityRelease
from app.models.release_challenge import ReleaseChallenge, ReleaseChallengeEvent
from app.models.requirement import Requirement

BASE = "/api/v1/releases"


def test_challenger_reference_decisions_and_append_only_history():
    assert engine.url.database == "qualitymind_test"
    client = TestClient(app)
    release_id = None
    requirement_id = None
    try:
        r = client.post("/api/v1/requirements", json={
            "title": "QA-103 synthetic requirement",
            "description": "Synthetic, disposable, not a real release approval",
        })
        assert r.status_code == 201, r.text
        requirement_id = r.json()["id"]

        r = client.post(BASE, json={"name": "QA-103 synthetic release", "version": "2026.11.19"})
        assert r.status_code == 201, r.text
        release_id = r.json()["id"]
        url = f"{BASE}/{release_id}"

        r = client.post(url + "/obligations", json={
            "requirement_id": requirement_id, "title": "Verify critical requirement",
            "critical": True,
        })
        assert r.status_code == 201, r.text
        obligation = r.json()["id"]
        r = client.post(f"{url}/obligations/{obligation}/evidence", json={
            "reference": "synthetic-pass", "tested_version": "2026.11.19", "result": "PASS",
        })
        assert r.status_code == 201, r.text

        challenges = url + "/challenges"
        initial = client.get(challenges + "/assessment")
        assert initial.status_code == 200
        assert initial.json()["dc01_state"] == "REVIEW_REQUIRED"
        assert initial.json()["state"] == "REVIEW_REQUIRED"

        # DC02-11: obligation does not exist (and is never persisted).
        invalid = client.post(challenges, json={
            "obligation_id": "00000000-0000-4000-8000-000000000099",
            "version": "2026.11.19", "source": "qa", "owner": "tester",
            "reason": "Invented obligation", "severity": "CRITICAL",
        })
        assert invalid.status_code == 422

        # DC02-10: version mismatch must not be accepted.
        stale = client.post(challenges, json={
            "obligation_id": obligation, "version": "2026.11.18",
            "source": "qa", "owner": "tester", "reason": "Old release version",
            "severity": "CRITICAL",
        })
        assert stale.status_code == 422

        payload = {
            "obligation_id": obligation, "version": "2026.11.19",
            "source": "human", "owner": "qa-lead",
            "reason": "Critical evidence provenance concern",
            "severity": "CRITICAL",
        }
        r = client.post(challenges, json=payload)
        assert r.status_code == 201, r.text
        item = r.json()
        challenge_id = item["id"]
        transition_url = challenges + "/" + challenge_id + "/transitions"
        assert item["status"] == "OPEN_UNQUALIFIED"
        assert client.get(challenges + "/assessment").json()["state"] == "REVIEW_REQUIRED"

        # DC02-12: same fingerprint is rejected, never counted twice.
        dupe = client.post(challenges, json=payload)
        assert dupe.status_code == 409, dupe.text
        assert len(client.get(challenges).json()) == 1

        # DC02-09: no harm or requested proof -> no qualification, no block.
        incomplete = client.post(transition_url, json={
            "to_status": "QUALIFIED", "actor": "qa-lead",
            "justification": "Need a defensible objection",
        })
        assert incomplete.status_code == 422
        assert client.get(challenges + "/assessment").json()["state"] == "REVIEW_REQUIRED"

        qualified = client.post(transition_url, json={
            "to_status": "QUALIFIED", "actor": "qa-lead",
            "justification": "Risk and proof are specific to this release",
            "plausible_harm": "An unverified control could cause a faulty release decision",
            "required_evidence": "Independent test report linked to the current version",
        })
        assert qualified.status_code == 200, qualified.text
        assert qualified.json()["status"] == "QUALIFIED"
        blocked = client.get(challenges + "/assessment").json()
        assert blocked["dc01_state"] == "REVIEW_REQUIRED"
        assert blocked["state"] == "NO_GO"
        assert blocked["qualifying_critical_challenge_ids"] == [challenge_id]

        resolved = client.post(transition_url, json={
            "to_status": "RESOLVED", "actor": "qa-lead",
            "justification": "An independent reviewer checked the synthetic evidence",
        })
        assert resolved.status_code == 200, resolved.text
        assert resolved.json()["status"] == "RESOLVED"
        assert client.get(challenges + "/assessment").json()["state"] == "REVIEW_REQUIRED"
        assert client.post(transition_url, json={
            "to_status": "QUALIFIED", "actor": "qa-lead",
            "justification": "Reopen without a new dossier is not allowed",
        }).status_code == 409

        history = client.get(challenges + "/" + challenge_id + "/history")
        assert history.status_code == 200
        assert [x["to_status"] for x in history.json()] == [
            "OPEN_UNQUALIFIED", "QUALIFIED", "RESOLVED",
        ]
        with SessionLocal() as db:
            saved = db.get(ReleaseChallenge, UUID(challenge_id))
            assert saved.status == "RESOLVED"
            events = db.scalars(select(ReleaseChallengeEvent).where(
                ReleaseChallengeEvent.challenge_id == UUID(challenge_id)
            )).all()
            assert len(events) == 3
    finally:
        with SessionLocal() as db:
            if release_id:
                release = db.get(QualityRelease, UUID(release_id))
                if release:
                    db.delete(release)
                    db.commit()
            if requirement_id:
                requirement = db.get(Requirement, UUID(requirement_id))
                if requirement:
                    db.delete(requirement)
                    db.commit()
