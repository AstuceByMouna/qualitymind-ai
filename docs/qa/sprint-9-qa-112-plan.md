# Sprint 9 — QA-112 Automation Hub MVP

## Goal
Make the first honest link between a human-reviewed test case **DRAFT** and a Playwright automation script reference, without executing code or implying passed test coverage.

Traceability: Automation Hub epic QA-4; FR-019 / QA-31 and FR-020 / QA-32.

## MVP slice
- Store an optional repository-relative Playwright script path for an existing test case, with a deterministic status `NOT_EXECUTED`.
- Read and modify the association via FastAPI, with PostgreSQL migration and isolated test database only.
- Display/edit the reference from the test-design interface; persist across F5.
- Use explicit validation for paths (no absolute paths, `..` traversal, network URLs or control characters). Store metadata only: **do not execute, open, resolve, fetch, or import the submitted path**.
- Unknown test case: 404; archived parent requirement: 409; invalid path: 422. Record no fabricated execution result or quality-gate approval.
- Include unit + isolated PostgreSQL API + Playwright UI tests.

## UAT acceptance
1. S9-UAT-01 — Add a valid relative Playwright path to a synthetic DRAFT test case.
2. S9-UAT-02 — Reload and confirm the same persisted script reference and `NOT_EXECUTED`.
3. S9-UAT-03 — Update the reference, reload, verify latest value.
4. S9-UAT-04 — Reject absolute/traversal/URL input with 422, preserve previous value.
5. S9-UAT-05 — Reject nonexistent test case (404) and archived requirement (409).
6. S9-UAT-06 — QA database isolation, regression CI, no script execution, no claimed PASS/approved coverage.

## Release policy
MVP First — Enterprise by Design. Create draft PR; run CI and manual UAT **before** merge. Keep production NO_GO until separate security, operational and release sign-off.

## Deliberately deferred
Actual Playwright execution, job orchestration, artifact storage, bulk script management, AI test generation, approval workflow and advanced UX.
