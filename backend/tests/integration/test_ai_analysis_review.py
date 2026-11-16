"""QA-90 fake provider exercises real isolated PostgreSQL persistence."""
import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.db import SessionLocal, engine
from app.models.requirement import Requirement
from app.modules.requirements.application.ai_contract import AIAnalysisPayload

def test_consent_review_audit_and_source_unchanged():
    assert engine.url.database=="qualitymind_test"
    assert engine.url.host in ("127.0.0.1","localhost")
    client=TestClient(app)
    with SessionLocal() as db:
        req=Requirement(title="QA90 imported",description="An operator can complete a test",
            import_source="QA90.csv",external_id="AI-90-A")
        db.add(req);db.commit();db.refresh(req);rid=req.id
    try:
        base=f"/api/v1/requirements/{rid}/ai-analysis"
        with patch("app.api.v1.ai_analysis._analyzer") as factory,patch.dict(
                os.environ,{"OPENAI_API_KEY":"ci_dummy_not_real","OPENAI_MODEL":"ci-fake"}):
            factory.return_value.analyze.return_value=AIAnalysisPayload.model_validate({
                "suggestions":[{"category":"test-case","observation":"Missing negative scenario",
                    "rationale":"Only the positive flow is clear",
                    "recommendation":"Add invalid-input test","suggested_test_case":"Given invalid input, expect rejection",
                    "risk_level":"medium"}]})
            assert client.post(base,json={"consent_to_external_processing":False,
                "confirms_no_sensitive_data":True}).status_code==422
            factory.assert_not_called()
            created=client.post(base,json={"consent_to_external_processing":True,
                "confirms_no_sensitive_data":True})
            assert created.status_code==201,created.text
            body=created.json()
            assert body["state"]=="completed" and body["model"]=="ci-fake"
            assert len(body["suggestions"])==1
            factory.return_value.analyze.assert_called_once()
        assert len(client.get(base).json())==1
        sid=body["suggestions"][0]["id"]
        review=client.post(f"{base}/{body['id']}/suggestions/{sid}/review",json={
            "decision":"edited","edited_recommendation":"Precise invalid input check"})
        assert review.status_code==200,review.text
        assert review.json()["suggestions"][0]["decision"]=="edited"
        assert client.post(f"{base}/{body['id']}/suggestions/{sid}/review",
            json={"decision":"accepted"}).status_code==409
        assert client.get(f"/api/v1/requirements/{rid}").json()["description"]=="An operator can complete a test"
    finally:
        with SessionLocal() as db:
            req=db.get(Requirement,rid)
            if req:db.delete(req)
            db.commit()

def test_missing_openai_key_never_creates_provider():
    assert engine.url.database=="qualitymind_test"
    client=TestClient(app)
    with SessionLocal() as db:
        req=Requirement(title="QA90 config",description="A user sees a message",
            import_source="QA90-config.csv",external_id="AI-90-B")
        db.add(req);db.commit();db.refresh(req);rid=req.id
    try:
        with patch.dict(os.environ,{"OPENAI_API_KEY":""}),patch("app.api.v1.ai_analysis._analyzer") as factory:
            r=client.post(f"/api/v1/requirements/{rid}/ai-analysis",json={
                "consent_to_external_processing":True,"confirms_no_sensitive_data":True})
            assert r.status_code==503
            factory.assert_not_called()
    finally:
        with SessionLocal() as db:
            req=db.get(Requirement,rid)
            if req:db.delete(req)
            db.commit()
