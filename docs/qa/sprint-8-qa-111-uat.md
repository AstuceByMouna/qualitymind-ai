# Sprint 8 — QA-111 Risk-Based Testing MVP — UAT

Status: **PENDING MANUAL UAT** | Release decision: **NO_GO** until all P0 checks pass and evidence is recorded.

Scope: FR-015 / FR-016 / FR-018. This is a human-assessed risk register and *draft-design gap* view, **not** evidence of executed, approved or adequate test coverage.

## Preconditions
- Checkout `feature/QA-111-risk-based-mvp`, clean working tree.
- Start the isolated QA PostgreSQL database (not DEV/production); apply migrations through the QA environment procedure in `docs/qa/qa-environment.md`.
- Start FastAPI and Next.js against the isolated QA environment.
- Record branch commit SHA, test database name and test execution date.
- Use disposable synthetic requirements only. Preserve existing records; clean up test fixtures after the session.

## Test cases

| ID | Priority | Procedure | Expected result | Status |
| --- | --- | --- | --- | --- |
| S8-UAT-01 | P0 | Open the Risk-Based Testing page from the app navigation. | Active requirements are listed and UNKNOWN is explicitly described as not evaluated (not LOW). | PASS (user-reported) |
| S8-UAT-02 | P0 | On a disposable requirement, change UNKNOWN to HIGH, reload (F5). | HIGH persists after reload; requirement sorts above MEDIUM/LOW/UNKNOWN. | PASS (user-reported) |
| S8-UAT-03 | P0 | Enable the HIGH-only filter. | Only HIGH requirements are shown; disabling restores the full loaded list. | PASS (user-reported) |
| S8-UAT-04 | P0 | For a HIGH requirement without test cases, then with one persisted *draft* test case, inspect the UI. | Initially HIGH + NO_DRAFT / design priority; afterwards DRAFT_ONLY, no false claim of approved/executed coverage. | PASS (user-reported) |
| S8-UAT-05 | P0 | Through the API, try invalid risk CRITICAL, extra field approved=true, nonexistent UUID and an archived requirement. | HTTP 422 / 422 / 404 / 409 respectively; existing stored risks remain unchanged. | NOT_RUN |
| S8-UAT-06 | P0 | Verify use of isolated QA DB, archive a synthetic requirement, then refresh the Risk page. | No DEV/production writes; archived item is absent from active risks; no stale approval or release verdict. | NOT_RUN |

## Manual execution log — 2026-11-25 (America/Toronto)

- **S8-UAT-01 PASS (user-reported):** In private browsing on `http://localhost:3001/risk`, hydration overlay disappeared and requirements were displayed. Earlier `Request failed` from the proxy was resolved by QA frontend configuration; browser extension involvement is suspected, not proven. Evidence: conversation report and earlier screenshots; no formal screenshot uploaded to this file. Backend QA endpoint returned `total: 48` before recheck.
- **S8-UAT-02 PASS (user-reported):** The user confirmed risk `HIGH` persisted after an F5 refresh, with no observations. Evidence: user report; exact disposable fixture ID, backend database name, commit SHA and ordering observation were not separately captured. Do not treat these as independently verified.
- **S8-UAT-03 PASS (user-reported):** User confirmed HIGH-only filter functioned correctly and full list was restored upon unchecking, with no observations. Evidence: user report; not independently verified.
- **S8-UAT-04 PASS (user-reported):** User confirmed transition of a HIGH requirement from NO_DRAFT to DRAFT_ONLY after saving a test case draft, with no observations. Evidence: user's conversation report; fixture identity and screenshots were not supplied, and result is not independently verified.
- **S8-UAT-05–06:** NOT_RUN; release decision remains NO_GO.

## Evidence record

For each case, record: execution date; environment; commit SHA; tester; actual result; PASS/FAIL/BLOCKED; screenshot or log reference; issue ID if failed. Do **not** mark a case PASS solely because CI is green.

## Automated checks

Commit `2f4cce0704d4bedb1932b86f5c7189f794de700d` (PR #52) had 7 successful GitHub Actions checks when reviewed on 2026-11-25 (America/Toronto): Next.js lint/build, API tests, unit tests, Postman, global search PostgreSQL, FastAPI Pytest/PostgreSQL and QA-84 Playwright/isolated PostgreSQL. Automated evidence does **not** replace manual UAT.

## Acceptance / release gate

- All six P0 UAT checks PASS, or failures are corrected and retested.
- Confirm no writes to development or production databases.
- Confirm branch is up to date and CI remains green on the final commit.
- Review any uncovered pagination scenario (the UI currently loads the first 200 requirements), and document it as a backlog limitation if acceptable for MVP.
- QA lead records explicit decision to move PR #52 from Draft to Ready for Review. No merge by default; production remains NO_GO until separate release approval.
