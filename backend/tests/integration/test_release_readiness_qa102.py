"""QA-102: release-readiness evidence is persisted and never auto-approves.

Runs exclusively against the disposable qualitymind_test PostgreSQL database.
"""
import os
from uuid import UUID

if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("QA-102 integration test requires POSTGRES_DB=qualitymind_test")

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal, engine
from app.main import app
from app.models.quality_governance import QualityRelease, ReleaseEvidence
from app.models.requirement import Requirement


def test_versioned_release_evidence_and_human_review():
    assert engine.url.database == "qualitymind_test"
    client = TestClient(app)
    release_id = None
    requirement_id = None
    try:
        response = client.post("/api/v1/requirements", json={
            "title": "QA-102 synthetic requirement",
            "description": "Disposable, non-confidential integration test",
        })
        assert response.status_code == 201, response.text
        requirement_id = response.json()["id"]

        response = client.post("/api/v1/releases", json={
            "name": "QA-102 integration", "version": "2026.11.19",
        })
        assert response.status_code == 201, response.text
        release_id = response.json()["id"]
        base = f"/api/v1/releases/{release_id}"
        assert client.get(f"{base}/readiness").json()["state"] == "UNDETERMINED"

        response = client.post(f"{base}/obligations", json={
            "requirement_id": requirement_id,
            "title": "Critical synthetic gate", "critical": True,
        })
        assert response.status_code == 201, response.text
        obligation_id = response.json()["id"]
        evidence_url = f"{base}/obligations/{obligation_id}/evidence"
        assert client.get(f"{base}/readiness").json()["obligations"][0]["evidence_status"] == "MISSING"

        def submit_evidence(result: str, tested_version: str):
            saved = client.post(evidence_url, json={
                "result": result,
                "tested_version": tested_version,
                "reference": f"synthetic-{result}-{tested_version}",
            })
            assert saved.status_code == 201, saved.text
            return client.get(f"{base}/readiness").json()

        stale = submit_evidence("PASS", "2026.11.18")
        assert stale["state"] == "UNDETERMINED"
        assert stale["obligations"][0]["evidence_status"] == "STALE"

        failed = submit_evidence("FAIL", "2026.11.19")
        assert failed["state"] == "NO_GO"

        reviewed = submit_evidence("PASS", "2026.11.19")
        assert reviewed["state"] == "REVIEW_REQUIRED"
        assert reviewed["obligations"][0]["evidence_status"] == "PASS"
        assert client.get(f"{base}/readiness").json() == reviewed

        with SessionLocal() as db:
            evidence = db.scalars(select(ReleaseEvidence).where(
                ReleaseEvidence.obligation_id == UUID(obligation_id)
            )).all()
            assert len(evidence) == 3
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
