"""QA-87 preview, atomic confirm, provenance and no duplicate records."""
import io
import os
from uuid import UUID
if os.getenv("POSTGRES_DB") != "qualitymind_test":
    raise RuntimeError("Integration tests require POSTGRES_DB=qualitymind_test")
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.db import SessionLocal,engine
from app.models.requirement import Requirement
from app.models.import_batch import ImportBatch
from app.models.acceptance_criterion import AcceptanceCriterion

def test_import_preview_confirm_and_reimport():
    assert engine.url.database=="qualitymind_test"
    client=TestClient(app)
    name="QA87-isolated-import.csv"
    payload=b"external_id,title,description,priority,acceptance_criteria\nQA87-A,Imported login,Sign in,High,Given credentials\n"
    batch_ids=[]
    try:
        for attempt in range(2):
            preview=client.post("/api/v1/imports/preview",files={"file":(name,io.BytesIO(payload),"text/csv")})
            assert preview.status_code==201,preview.text
            data=preview.json()
            batch_ids.append(data["id"])
            assert data["accepted"]==(1 if attempt==0 else 0)
            assert data["ignored"]==(0 if attempt==0 else 1)
            row=data["rows"][0]
            assert row["description"]=="Sign in"
            assert row["priority"]=="High"
            assert row["acceptance_criteria"]=="Given credentials"
            assert row["requirement_id"] is None
            snapshot=client.get(f"/api/v1/imports/{data['id']}")
            assert snapshot.status_code==200
            assert snapshot.json()["rows"][0]["description"]=="Sign in"
            assert client.get("/api/v1/requirements",params={"q":"Imported login"}).json()["total"]==(0 if attempt==0 else 1)
            confirmed=client.post(f"/api/v1/imports/{data['id']}/confirm")
            assert confirmed.status_code==200,confirmed.text
            assert confirmed.json()["state"]=="confirmed"
            assert UUID(confirmed.json()["rows"][0]["requirement_id"])
            assert client.post(f"/api/v1/imports/{data['id']}/confirm").json()["state"]=="confirmed"
        with SessionLocal() as session:
            models=list(session.scalars(select(Requirement).where(
                Requirement.import_source==name,Requirement.external_id=="QA87-A")).all())
            assert len(models)==1
            assert models[0].priority=="High"
            criteria=list(session.scalars(select(AcceptanceCriterion).where(
                AcceptanceCriterion.requirement_id==models[0].id)).all())
            assert len(criteria)==1 and criteria[0].content=="Given credentials"
        bad=client.post("/api/v1/imports/preview",files={"file":("bad.csv",b"external_id,title,description\nBAD-1,,text\n","text/csv")})
        assert bad.status_code==201
        batch_ids.append(bad.json()["id"])
        assert bad.json()["rejected"]==1
        assert client.post(f"/api/v1/imports/{bad.json()['id']}/confirm").status_code==409
    finally:
        with SessionLocal() as session:
            for req in session.scalars(select(Requirement).where(Requirement.import_source==name)).all():
                session.delete(req)
            for batch_id in batch_ids:
                batch=session.get(ImportBatch,UUID(batch_id))
                if batch:session.delete(batch)
            session.commit()
