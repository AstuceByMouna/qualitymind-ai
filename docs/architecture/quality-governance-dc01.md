# Quality Governance — DC-01 release readiness prototype

The existing sidebar item is enabled; it leads to /governance. Requirements Intelligence remains unchanged.

## Scope
- Release creation and listing, with immutable version identifiers (editing is not in scope).
- Release obligations referencing active requirements; each is critical or non-critical.
- Manually entered evidence: result PASS/FAIL, exact tested version, reference.
- Deterministic policy: critical FAIL => NO_GO; otherwise missing or stale => UNDETERMINED; otherwise REVIEW_REQUIRED. **Never GO**.
- Data persists in PostgreSQL with Alembic migration c920a0000001.
- API endpoints under /api/v1/releases; Next.js same-origin proxy under /api/governance.

## Explicit limitations
- Human-entered evidence is not independently verified; reference alone is not proof of test execution.
- No authentication/RBAC, immutability guarantee, signatures, decision ledger, exception approvals or production-grade governance.
- Only latest entered evidence per obligation is evaluated, ordered by timestamp/id. Evidence is not revalidated after a requirement changes; integrate fingerprint-based invalidation later.
- No automatic Quality Gate configuration, adversarial Challenger, or automated ingestion from CI yet.
- Requirements dropdown fetches the first 100 active requirements for the MVP; pagination/search will be added separately.
- Do not use this prototype to authorize enterprise deployment.

## Manual QA validation
1. Apply migration on isolated QA DB only, start API :8001 and frontend :3001.
2. Open /governance and create a release; confirm UNDETERMINED.
3. Add an obligation linked to an active requirement; confirm MISSING.
4. Add PASS with a different version; confirm STALE and UNDETERMINED.
5. Add FAIL for the correct version and critical obligation; confirm NO_GO.
6. Add PASS for the correct version; confirm REVIEW_REQUIRED, never automatic GO.
7. Verify 404 unknown release, 422 invalid payload, no regression in Requirements.

Release requires CI and UAT validation. No deployment approval is provided by this module.
