"""Read and import external test evidence alongside Automation Hub metadata."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.execution_evidence import ExecutionEvidence
from app.models.requirement import Requirement
from app.models.test_case import TestCase
from app.modules.automation_hub.execution_evidence import definition_fingerprint
from app.schemas.execution_evidence import (
    MAX_IMPORT_BYTES, ExecutionEvidenceRead, ExecutionHistory, ExecutionImport,
)

router = APIRouter(prefix="/api/v1/test-cases", tags=["execution-evidence"])


def _read(row: ExecutionEvidence, case: TestCase, fingerprint: str) -> ExecutionEvidenceRead:
    return ExecutionEvidenceRead(
        id=row.id, test_case_id=row.test_case_id, requirement_id=case.requirement_id,
        external_run_id=row.external_run_id, external_result_id=row.external_result_id,
        script_path=row.script_path, tested_commit_sha=row.tested_commit_sha,
        executed_at=row.executed_at, imported_at=row.imported_at, outcome=row.outcome,
        provenance=row.provenance, definition_fingerprint=row.definition_fingerprint,
        context_changed=(row.script_path != case.playwright_script_path
                         or row.definition_fingerprint != fingerprint),
    )


async def _bounded_result(request: Request) -> ExecutionImport:
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
        raise HTTPException(415, "Expected application/json")
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_IMPORT_BYTES:
            raise HTTPException(413, "Import exceeds 4096 bytes")
        body.extend(chunk)
    try:
        return ExecutionImport.model_validate_json(body)
    except ValidationError:
        raise HTTPException(422, "Invalid execution result") from None


@router.get("/{test_case_id}/execution-evidence", response_model=ExecutionHistory)
def history(test_case_id: UUID, offset: int = Query(0, ge=0, le=2147483647),
            db: Session = Depends(get_db)):
    case = db.get(TestCase, test_case_id)
    if case is None:
        raise HTTPException(404, "Test case not found")
    fingerprint = definition_fingerprint(case)
    rows = db.scalars(
        select(ExecutionEvidence).where(ExecutionEvidence.test_case_id == test_case_id)
        .order_by(ExecutionEvidence.imported_at.desc(), ExecutionEvidence.id.desc())
        .offset(offset).limit(51)
    ).all()
    return ExecutionHistory(
        items=[_read(row, case, fingerprint) for row in rows[:50]],
        next_offset=offset + 50 if len(rows) > 50 else None,
    )


@router.post(
    "/{test_case_id}/execution-evidence", status_code=201, response_model=ExecutionEvidenceRead,
    responses={200: {"model": ExecutionEvidenceRead}, 409: {}, 413: {}, 415: {}, 422: {}},
    openapi_extra={"requestBody": {"required": True, "content": {
        "application/json": {"schema": ExecutionImport.model_json_schema()},
    }}},
)
def import_evidence(test_case_id: UUID, response: Response,
                    data: ExecutionImport = Depends(_bounded_result),
                    db: Session = Depends(get_db)):
    if data.test_case_id != test_case_id:
        raise HTTPException(422, "Test case identifier does not match the route")

    # Lock the parent before its case. Archive updates serialize with imports,
    # and the case lock serializes retries and concurrent path changes.
    requirement_id = db.scalar(select(TestCase.requirement_id).where(TestCase.id == test_case_id))
    if requirement_id is None:
        raise HTTPException(404, "Test case not found")
    parent = db.scalar(select(Requirement).where(Requirement.id == requirement_id).with_for_update(read=True))
    case = db.scalar(select(TestCase).where(TestCase.id == test_case_id).with_for_update())
    if case is None or parent is None or case.requirement_id != parent.id:
        raise HTTPException(404, "Test case not found")

    fields = data.model_dump()
    fingerprint = definition_fingerprint(case)
    existing = db.scalar(select(ExecutionEvidence).where(
        ExecutionEvidence.test_case_id == test_case_id,
        ExecutionEvidence.external_run_id == data.external_run_id,
        ExecutionEvidence.external_result_id == data.external_result_id,
    ))
    if existing is not None:
        if any(getattr(existing, key) != value for key, value in fields.items()):
            raise HTTPException(409, "External result identity is already used with different data")
        response.status_code = 200
        return _read(existing, case, fingerprint)

    if parent.archived_at is not None:
        raise HTTPException(409, "Requirement is archived")
    if case.playwright_script_path is None or case.playwright_script_path != data.script_path:
        raise HTTPException(409, "Result must match the current script association")

    row = ExecutionEvidence(**fields, definition_fingerprint=fingerprint)
    try:
        db.add(row)
        db.flush()
        result = _read(row, case, fingerprint)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Execution evidence could not be recorded") from None
    return result
