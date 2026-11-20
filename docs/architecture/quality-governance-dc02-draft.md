# QA-103 — Decision Challenger (DRAFT; P0 policy not approved)

Reference: https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/3080208
Dependent on locally accepted QA-102; this design never authorizes a production release.

## Routes
All routes are scoped to /api/v1/releases/{release_id}/challenges.
- POST /: create OPEN_UNQUALIFIED objection. Reject missing/wrong release obligation or wrong version (422).
- GET /: list persisted objections; GET /assessment: combined DC-01 + DC-02 output.
- GET /{challenge_id}: detail; GET /{challenge_id}/history: creation/transition events.
- POST /{challenge_id}/transitions: qualify, resolve, or reject with actor and justification.

## State machine and draft policy P0
- OPEN_UNQUALIFIED -> QUALIFIED (plausible harm and requested evidence required), or REJECTED.
- QUALIFIED -> RESOLVED or REJECTED. Both terminal. Invalid transition = 409.
- Exact duplicate (release, obligation, version, reason) = 409.
- Base DC-01 NO_GO always remains NO_GO.
- Qualified, critical, unresolved objection at current version with required harm/proof -> NO_GO.
- Otherwise preserve DC-01 UNDETERMINED; otherwise REVIEW_REQUIRED; **never GO**.
- OPEN_UNQUALIFIED cannot by itself block a release.

## Test mapping
- Pure policy unit tests exercise baseline DC02-01 through DC02-08 and stale/incomplete negative variations.
- PostgreSQL API integration exercises DC02-09 incomplete qualification, DC02-10 wrong version, DC02-11 invented obligation, DC02-12 duplicate, plus qualification-resolution lifecycle.
- API contract verifies 422 input validation and absence of any approve endpoint.
- CI expected to upgrade, downgrade and re-upgrade on disposable qualitymind_test DB.
- UI implementation, true QA UAT, approved P0 decision, and full CI results are **not yet complete**.

## Security and audit limitations
- Actor, source and owner are **client-supplied strings with no authentication or RBAC**, so human identity is not verified.
- Event history is append-only **at the API level only**; privileged DB users can alter it and cascade deletion erases it. No tamper-resistant audit or signed release approvals.
- Duplicate detection is exact-text after trimming; paraphrases and case variations may bypass it.
- No LLM can decide GO and no release GO endpoint exists.
- No automatic invalidation after a source requirement changes.
- **Not suitable for production, security-sensitive release governance, or regulated approval.**
- Test migrations exclusively on disposable qualitymind_test or isolated QA; never migrate DEV for this draft.
