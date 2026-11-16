# ADR-002 — Requirement lifecycle (QA-95 / FR-007)

Status: Accepted for MVP | 2026-11-16

## Context and decision
Status values: Draft, In Review, Ready. Both new and existing records default to Draft.

Transitions:
- Draft → In Review
- In Review → Ready
- In Review → Draft
- Ready → Draft

Any other transition (including repeated status) returns HTTP 409 without a write.
Invalid status or schema returns 422; unknown UUID returns 404; FastAPI
returns 422 for malformed JSON.

## Technical design
POST /api/v1/requirements/{id}/transitions, body {"status":"In Review"}.
GET /api/v1/requirements/{id}/transitions returns chronological history.
Separate from ordinary PATCH title/description. Persist status with Alembic;
PostgreSQL row locking prevents stale concurrent transitions.
History is append-only at API level and stores requirement UUID, old/new
status, UTC timestamp and source ("api"). No user identity is claimed
without authentication. Status Ready is NOT regulatory approval or
release sign-off. RBAC is out of MVP scope.

Keep search, pagination, acceptance criteria and edit flows compatible.
Use isolated QA database and automated Quality Gates.
Traceability: FR-007, QA-8, QA-95, QA-5.
