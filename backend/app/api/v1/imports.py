"""QA-87 manual preview/confirm import. PostgreSQL controls duplicate and atomic commits."""
import hashlib
import json
from pathlib import Path
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.import_batch import ImportBatch
from app.models.requirement import Requirement
from app.models.acceptance_criterion import AcceptanceCriterion
from app.modules.requirements.application.import_parser import InvalidImport, parse, MAX_FILE_BYTES

router = APIRouter(prefix="/api/v1/imports", tags=["imports"])

def _summary(batch: ImportBatch):
    return {
        "id": batch.id, "source_name": batch.source_name, "state": batch.state,
        "accepted": batch.accepted, "rejected": batch.rejected, "ignored": batch.ignored,
        "created_at": batch.created_at, "confirmed_at": batch.confirmed_at,
        "rows": [{"row": row["row"],"external_id": row["external_id"],"title": row["title"],
                  "decision": row["decision"],"error": row.get("error")} for row in batch.rows],
    }

@router.post("/preview", status_code=201)
async def preview_import(file: UploadFile = File(...), mapping: str = Form("{}"), db: Session = Depends(get_db)):
    name=Path((file.filename or "").replace("\\","/")).name
    if not name or len(name)>255:
        raise HTTPException(status_code=422,detail="Invalid file name")
    try:
        mapping_object=json.loads(mapping)
        if not isinstance(mapping_object,dict):
            raise ValueError("Mapping must be an object")
    except (ValueError,TypeError):
        raise HTTPException(status_code=422,detail="Invalid mapping JSON")
    data=await file.read(MAX_FILE_BYTES+1)
    try:
        rows=parse(data,name,mapping_object)
    except InvalidImport as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc
    existing=set(db.scalars(select(Requirement.external_id).where(
        Requirement.import_source==name, Requirement.external_id.is_not(None)
    )).all())
    for row in rows:
        row["decision"]="reject" if row["error"] else ("ignore" if row["external_id"] in existing else "create")
    batch=ImportBatch(
        source_name=name,digest=hashlib.sha256(data).hexdigest(),rows=rows,
        accepted=sum(row["decision"]=="create" for row in rows),
        rejected=sum(row["decision"]=="reject" for row in rows),
        ignored=sum(row["decision"]=="ignore" for row in rows),
    )
    db.add(batch);db.commit();db.refresh(batch)
    return _summary(batch)

@router.get("/{batch_id}")
def get_import_batch(batch_id: UUID, db: Session = Depends(get_db)):
    batch=db.get(ImportBatch,batch_id)
    if batch is None: raise HTTPException(status_code=404,detail="Import batch not found")
    return _summary(batch)

@router.post("/{batch_id}/confirm")
def confirm_import(batch_id: UUID, db: Session = Depends(get_db)):
    batch=db.scalar(select(ImportBatch).where(ImportBatch.id==batch_id).with_for_update())
    if batch is None: raise HTTPException(status_code=404,detail="Import batch not found")
    if batch.state=="confirmed":
        return _summary(batch)
    # Validate every file row before writing to prevent partial imports.
    if batch.rejected:
        raise HTTPException(status_code=409,detail="Fix rejected rows and preview again before confirmation")
    new_count=0
    ignored_count=0
    for row in batch.rows:
        if row["decision"]=="reject":
            raise HTTPException(status_code=409,detail="Invalid staging rows")
        exists=db.scalar(select(Requirement.id).where(
            Requirement.import_source==batch.source_name,Requirement.external_id==row["external_id"]
        ))
        if exists:
            ignored_count+=1
            continue
        req=Requirement(title=row["title"],description=row["description"],status="Draft",
            import_source=batch.source_name,external_id=row["external_id"],
            priority=row["priority"] or None)
        db.add(req);db.flush()
        if row["acceptance_criteria"]:
            db.add(AcceptanceCriterion(requirement_id=req.id,content=row["acceptance_criteria"],position=1))
        new_count+=1
    batch.accepted=new_count
    batch.ignored=ignored_count
    batch.state="confirmed"
    batch.confirmed_at=datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409,detail="Import identity conflict. Preview again.") from exc
    db.refresh(batch)
    return _summary(batch)
