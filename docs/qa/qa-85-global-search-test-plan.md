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
QA85-TC01...TC06: **NOT RUN** until relevant GitHub Actions jobs report success.

## Quality Gates
- Backend CI Pytest unit/API/integration.
- Frontend CI lint/build.
- Postman API CI regression.
- QA-84 existing E2E regression (separate job).
- QA-85 isolated Playwright E2E new workflow.
- PR review and final merge decision, without automatically closing Jira.
