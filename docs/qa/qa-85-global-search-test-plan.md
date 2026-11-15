# QA-85 — Global Requirements Search

Jira: https://gharbiconsulting.atlassian.net/browse/QA-85  
Sprint 4. Parent Requirement: Requirements Intelligence.

## User behavior
- Search covers the entire PostgreSQL registry, not just the five current rows.
- Search fields: title, description, UUID; case-insensitive substring match.
- Search is submitted explicitly using the Search button or Enter. Clear removes it.
- Search is stored in the shareable URL `?q=...`; page is `?page=2`.
- Starting a new search resets to page 1; Previous/Next retain `q`.
- Page outside range redirects to last existing filtered page.
- Empty term preserves existing listing, unmatched term returns total 0 and clear empty state.

## API contract
`GET /api/v1/requirements?limit=5&offset=0&q=term`.
- `q`: optional UTF-8 string, max 200 characters (422 if longer).
- Whitespace trimmed before matching. Literal percent, underscore and backslash are escaped.
- All filters are bound SQLAlchemy expressions; count and page apply the same WHERE.
- Sort stable: created_at DESC, id DESC. No migration required.

## Automated evidence
- Pytest API contract mocks: query bounded and applied to count and rows.
- Pytest PostgreSQL integration: eight unique requirements; filtering, pages, case-insensitive search, literal special characters, UUID search, zero matches; cleanup.
- Playwright QA-85 E2E: six real UI/API/DB tests with nine disposable records.
- QA-85 workflow seeds these records in isolated `qualitymind_qa` only and confirms precisely nine rows cleaned.

## Acceptance status
QA85-TC01–TC06: **PASS** via dedicated [QA-85 E2E CI](https://github.com/AstuceByMouna/qualitymind-ai/actions/runs/43690615924) on commit `c5b9b267`: 6/6 Playwright PASS in 4.9 seconds without retries or skips. Nine dedicated requirements were deleted and confirmed absent. The separate existing QA-84 E2E workflow ran 14/14 previously established tests successfully; its six QA-85 tests were deliberately skipped because it uses a separate fixture.

Backend CI: [run 43690615858](https://github.com/AstuceByMouna/qualitymind-ai/actions/runs/43690615858) **PASS** (22 unit, 37 API, 17 PostgreSQL integration). Frontend CI: [run 43690615902](https://github.com/AstuceByMouna/qualitymind-ai/actions/runs/43690615902) **PASS** (lint/build). Postman CI: [run 43690615834](https://github.com/AstuceByMouna/qualitymind-ai/actions/runs/43690615834) **PASS**. QA-84 E2E: [run 43690615842](https://github.com/AstuceByMouna/qualitymind-ai/actions/runs/43690615842) **PASS**.

Awaiting independent PR review and explicit merge decision; do not mark Jira Done before review.

## Quality Gates
- Backend CI Pytest unit/API/integration.
- Frontend CI lint/build.
- Postman API CI regression.
- QA-84 existing E2E regression (separate job).
- QA-85 isolated Playwright E2E new workflow.
- PR review and final merge decision, without automatically closing Jira.
