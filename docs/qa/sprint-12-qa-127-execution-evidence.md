# QA-127 — External execution evidence and recovery

[Jira QA-127](https://gharbiconsulting.atlassian.net/browse/QA-127) · [Sprint 12 P0 UAT](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/4128865)

## Contract and data model

`POST /api/v1/test-cases/{id}/execution-evidence` takes one JSON object, up to 4096 bytes. Set `Content-Type: application/json`. Use a linked draft under an active requirement. Run and result identifiers are 1–128 characters using ASCII letters, digits, dots, dashes and underscores, starting with a letter or digit.

```json
{
  "test_case_id": "00000000-0000-4000-8000-000000000127",
  "external_run_id": "synthetic-run-01",
  "external_result_id": "synthetic-result-01",
  "script_path": "frontend/tests/e2e/home.spec.ts",
  "tested_commit_sha": "fda962e0b450e8b9f42dc5e5cf593c76213edd23",
  "executed_at": "2026-11-28T08:15:00-05:00",
  "outcome": "PASS"
}
```

A new import returns 201 with the result fields, normalized UTC execution time, the server-generated `id` and `imported_at`, the derived `requirement_id`, `provenance: "USER_IMPORTED"`, `definition_fingerprint: "v1:sha256:<digest>"` and `context_changed: false`. An identical replay returns 200 and the same ID, including after archive or a script change. Drift is evaluated using the current context. A different payload for the same test/run/result returns 409. New imports on archived requirements or with missing/mismatched script associations return 409. Unknown test IDs return 404. Invalid JSON/fields return a generic 422, oversized requests 413, and non-JSON content 415.

`GET /api/v1/test-cases/{id}/execution-evidence?offset=0` returns `{"items": [], "next_offset": null}` for a draft without evidence. Nonempty pages contain up to 50 declarations, newest import first, with the same fields as an import response. Refresh history after new imports before continuing to older pages. Archived records remain readable through the history API.

Alembic revision `f127a0000001` adds one table with a unique test/run/result identity, a history index and a restrictive foreign key to the test case. The requirement is derived through that test case. Archiving a requirement preserves history. The constraint prevents a hard delete of a referenced draft or a cascading hard delete of its requirement. Existing acceptance-criterion deletion continues to null the draft criterion link. The hash covers the persisted test definition at import time. The script path is a separate snapshot. Both are compared to the current context and provide no attestation of the historical executed source. The request transaction locks the parent for shared reading and locks the draft before checking identity and association. Imports leave the draft, script association and release evidence unchanged.

The application exposes no history update or deletion operation. PostgreSQL role holders with direct write access remain trusted operators. Release decisions still use their existing evidence contracts.

## Recovery

If application rollback is needed, restore the prior application version while retaining the additive table and its Alembic revision. The prior application can read existing test and requirement data. Its hard-delete operations, if performed directly in SQL, remain restricted where history exists. Restore from a verified database backup through the owner's normal recovery process if a later migration or operational incident requires database recovery. Never use the downgrade as routine recovery of a populated database. Downgrade acquires an exclusive table lock before checking for rows and refuses if history exists. Verify upgrade/downgrade only on a disposable synthetic PostgreSQL database.

## Prepare an isolated candidate workspace

From the existing QualityMind repository in PowerShell, start with read-only checks. Preserve any local diff and stashes.

```powershell
git --no-optional-locks status --short --branch
git stash list
git ls-remote origin refs/heads/main refs/heads/feature/QA-127-execution-evidence-mvp
```

Use a fresh sibling directory and verify its SHA against the PR before continuing. Local commands below assume Python and Node dependencies are available in the candidate workspace. If dependencies need installation, use its dependency manifests and the QA setup instructions.

```powershell
git clone --single-branch --branch feature/QA-127-execution-evidence-mvp https://github.com/AstuceByMouna/qualitymind-ai.git ..\qualitymind-qa127
Set-Location ..\qualitymind-qa127
git rev-parse HEAD
git status --short --branch
```

Provision the local `.env.qa` with a unique QA password according to the [QA environment guide](qa-environment.md). Reuse the current QA password if sharing the existing dedicated QA container. Keep this file local. Check the three QA ports before starting duplicate processes.

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5433,8001,3001 -ErrorAction SilentlyContinue
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py db-up
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py migrate
```

The QA launcher verifies `qualitymind_qa` and loopback port 5433 before migrating. If existing QA API/UI processes belong to another checkout, stop them using their owning terminals before starting the candidate in two separate PowerShell terminals, each at the candidate root.

```powershell
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py api
```

```powershell
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py frontend
```

```powershell
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py check
```

## Manual UAT

Use synthetic data at `http://127.0.0.1:3001`. Create an active requirement, add a criterion and save a draft in Test Design. Associate `frontend/tests/e2e/home.spec.ts` to the draft. Open the draft's traceability link, then its execution evidence panel. Record the candidate SHA, environment, actual result and evidence against each case in the canonical UAT plan.

1. **S12-UAT-01** — Insert the JSON template, enter a unique run/result, a full synthetic tested SHA and an ISO timestamp with an offset. Import PASS. Refresh. Verify the same row with the SHA, script, evidence source, test ID and UTC timestamps. Confirm the test remains DRAFT.
2. **S12-UAT-02** — Import FAIL with a different result ID. Refresh. Confirm both outcomes and distinct internal IDs. Open evidence on a separate draft and confirm the empty state.
3. **S12-UAT-03** — Submit the first payload again. Confirm the existing ID and unchanged row count. Change its outcome and replay. Confirm HTTP 409 and unchanged history. Review concurrent replay results in the PostgreSQL suite.
4. **S12-UAT-04** — In QA Swagger at `http://127.0.0.1:8001/docs`, try invalid UUID, SHA, timestamp and status, oversized JSON, an extra field, an invalid relative path, a different associated path, a missing test and a test under an archived requirement. Verify the HTTP statuses described above, sanitized errors and no added rows.
5. **S12-UAT-05** — Change the Playwright association from Test Design. Refresh execution history and confirm the original script and fingerprint remain visible with the changed-context message. Check DRAFT and QualityMind execution NOT_EXECUTED. Review evidence that imports caused no external calls, file execution or release evidence writes.
6. **S12-UAT-06** — Review the migration round trip and populated-downgrade refusal, regression results and the CI links for the candidate SHA. Record owner acceptance in the canonical plan before any merge authorization.

Manual owner UAT starts at `NOT_RUN` for all six cases.
