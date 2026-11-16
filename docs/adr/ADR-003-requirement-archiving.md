# ADR-003 — Reversible requirement archiving (QA-97)

Status: Proposed, 2026-11-16.

An archive flag is independent from lifecycle status (Draft/In Review/Ready).
Soft-delete stores archived_at (UTC) and archive_source ("api"). Repeated archive and
restore requests are idempotent. GET /requirements?archived=true shows only archives;
default lists and searches exclude them, including totals. Individual GET
remains available; UUID, criteria, and lifecycle audit trail are unchanged.

POST /{id}/archive and POST /{id}/restore perform row-locked atomic updates.
UI asks for explicit confirmation before archiving. No hard delete, retention policy,
RBAC or formal approval in MVP. Tests must isolate data from DEV.

The functional requirement number for this new capability is not yet approved;
do not assign FR-008 to the controlled catalogue without governance review.
