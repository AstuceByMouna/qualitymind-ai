# QA-69 — Automation and traceability baseline

[QA-69](https://gharbiconsulting.atlassian.net/browse/QA-69) · [QA-77 network resilience](https://gharbiconsulting.atlassian.net/browse/QA-77) · [QA-78 diagnostics](https://gharbiconsulting.atlassian.net/browse/QA-78) · [QA-80 CI](https://gharbiconsulting.atlassian.net/browse/QA-80) · [QA-81 traceability](https://gharbiconsulting.atlassian.net/browse/QA-81) · [Campaign plan](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/4259990)

Application baseline `fda962e0b450e8b9f42dc5e5cf593c76213edd23`. The owner candidates remain independent. This supplement references the [existing action/evidence matrix](test-coverage-matrix.md) and [requirements catalogue](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145). Historical statuses in those documents date from their respective reviews.

## Source inventory

The [CSV inventory](qa-69-inventory.csv) lists paths, lines, tests, configured workflows and API declarations. Regenerate it with `python -B scripts/qa_inventory.py docs/qa/qa-69-inventory.csv`. The generator walks Python AST and scans registered TypeScript test expressions and Postman collection entries. Counts represent declarations. Parametrized tests and generated cases may expand at collection. Browser classifications are signals from explicit tags or request/interception code, subject to review. No runtime coverage percentage is derived.

| Layer | Snapshot |
| --- | --- |
| Pytest unit | 43 function declarations. |
| Pytest API contract | 47 function declarations exercised through FastAPI TestClient. |
| Pytest PostgreSQL integration | 24 function declarations. Dedicated DB required. |
| Postman | 9 versioned requests with 20 `pm.test` calls. |
| Playwright | 44 declarations, including 2 added here. 16 show simulated API signals, 18 show integration intent and 10 have unclassified browser/API topology. |
| Runtime skip conditions | 18 declarations contain a skip/fixme signal. Inspect the resolved runtime report to count skips. Fixture/environment guards appear in the QA-84/85 edit/search, acceptance criteria, edit freshness and risk cases. |
| API | 41 declared HTTP routes, including health. Source scan only. |
| GitHub Actions | 5 configured workflows. |

## Reviewed traceability

The execution evidence column identifies precisely what was observed or which configured job can produce a result. The PR check links record the candidate actually run. Browser tests with intercepted API responses verify the mapped UI behavior.

| Requirement / source | Jira | Acceptance criterion or checked slice | Automated test | Execution evidence | Gap |
| --- | --- | --- | --- | --- | --- |
| FR-001 create | QA-49 | AC-001 persist valid title and description | `test_create_and_retrieve_requirement` in `test_requirements_integration.py`; Postman Create and Details | Backend PostgreSQL job and optional Postman workflow | Authenticated actor prerequisite belongs to NFR-001 and this local MVP has no validated authentication flow. |
| Requirements list and detail | QA-53 / QA-54 | API shape and ordering, absent UUID returns 404 (historical TC-001/002/004) | `test_list_order_and_pagination_with_isolated_test_records`, `test_get_unknown_requirement_returns_404` | Backend PostgreSQL job; Postman List, Details and Not Found | Distinguish overlapping 404 checks by test purpose. Fixture persistence is owned by PostgreSQL tests. |
| FR-005 acceptance criteria | QA-94 | Add, edit, cancel and delete a criterion on its requirement | `acceptance-criteria.spec.ts` QA94-TC01 | QA-84 CI invokes QA Playwright suite; fixture gate applies | Confirm scenario-level execution and fixture availability from the XML. |
| FR-008/009/011/014 partial | QA-107 | Preview and save positive/negative test drafts with exact source | `test_test_design_preview_persistence_scoping_and_rejection`, `test-design.spec.ts` | Backend PostgreSQL job, mocked browser checks in suite | Approval workflow and generation variants need separate approved scope. |
| FR-015–018 partial | QA-111 | Factual UNKNOWN, HIGH and draft coverage signals | `test_risk_assessment_prioritization_and_draft_truth`, `risk.spec.ts`, `risk-real-qa.spec.ts` | Backend PostgreSQL job; real browser case needs QA84 fixture | Assessed risk and draft association do not establish approved or executed coverage. |
| FR-019/020 partial | QA-112 | Persist metadata-only script association and retain NOT_EXECUTED | `test_automation_association_is_metadata_only_and_safe`, `automation-hub.spec.ts` | Backend PostgreSQL job; mocked browser shows association state | A complete browser-to-database path is unverified by the mock scenario. |
| FA deterministic classification slice | QA-124 | Contract rejects invalid excerpts and shows heuristic indications | `test_failure_analysis_qa124.py`, `failure-analysis.spec.ts`; new QA-77 transport retry test | 165 local unit and contract tests plus 2 simulated resilience tests, exit 0 | Evidence is limited to MVP classification, without raw run ingestion. |
| DC-01 and DC-02 | QA-102 / QA-103 | Version-specific evidence and qualified objections affect deterministic advice | `test_release_readiness_qa102.py`, `test_decision_challenger_qa103.py` | PostgreSQL integration in Backend CI; Playwright mocks in the existing suite | QA-106 draft context corrections and its owner UAT are separately governed. |
| FR-030 partial | QA-126 / QA-44 | AC1–AC5 read-only requirement, criterion, draft and script relationships | `test_traceability_uses_existing_links_without_writes`, `traceability.spec.ts` | Backend integration and mocked browser cases in existing QA suite | QA-127 execution evidence remains a separate pending candidate. |
| UI resilience and diagnostics | QA-69 AC4/6, QA-77, QA-78 | Loss of transport, delayed loading, API error and successful recovery | `synthetic-network.spec.ts` | 2 local Chromium cases, exit 0. JUnit and HTML generated. | Mock scenarios do not prove backend retries or long-running reliability. |

## Workflow and gap review

- Backend CI runs three Pytest jobs. Its PostgreSQL job applies migrations in a disposable DB and publishes JUnit. Frontend CI performs lint and build.
- Postman API CI runs the versioned collection only when `POSTMAN_CI_ENABLED` is true. QA-84 starts isolated API, UI and PostgreSQL and runs the existing QA Playwright suite. QA-85 runs its scoped search subset with separate synthetic fixtures. Inspect their artifacts for case-level outcomes. These workflows do not automatically run the separate QA-69 resilience config.
- Requirements create/read, validation, 404 and pagination overlap intentionally across unit/API, integration and Postman levels. Preserve each layer's distinct signal. Review duplicate browser search coverage when both QA-84 and QA-85 have qualifying fixtures. QA-84 invocation alone does not establish QA-85 fixture availability.
- The existing suite has fixture-gated skips. Mark skipped cases explicitly, especially when using a generic DEV configuration. Source review found tests with mixed mock/real steps. Case-level historical retry frequencies, unstable-test rates and continuous Chromium/Firefox/WebKit compatibility remain unverified.
- Live Jira and real AI were outside this campaign. Requirements auth/RBAC, evidence ingestion, execution history and release-purpose attestation need separate approved contracts and compatible evidence. No branch-protection or CI gate change.

## Reproduce and collect sanitized evidence

```powershell
git --no-optional-locks status --short --branch
git stash list
git ls-remote origin refs/heads/main refs/heads/test/QA-69-automation-baseline
git clone --single-branch --branch test/QA-69-automation-baseline https://github.com/AstuceByMouna/qualitymind-ai.git ..\qualitymind-qa69
Set-Location ..\qualitymind-qa69
git rev-parse HEAD
python -B scripts/qa_inventory.py docs/qa/qa-69-inventory.csv
Set-Location frontend
node node_modules/next/dist/bin/next typegen
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js -- playwright.resilience.config.ts tests/resilience/synthetic-network.spec.ts
node node_modules/playwright/cli.js test --config playwright.resilience.config.ts
```

Inventory, typegen, TypeScript, lint and the two browser scenarios exited 0. The frontend config starts and stops a dedicated Next server on loopback 13033, routes fixture responses in the browser, and sets the server upstream to unused loopback port 1. An existing Chrome executable may be set with `QM_RESILIENCE_CHROMIUM_BIN`. The observed local run supplied a font fixture through `QM_TEST_FONT_FIXTURE`. The two scenarios require no FastAPI or PostgreSQL startup. The existing server instances were outside this test topology.

From `backend` in this clone, the local contract run used a dummy database target and disabled paid AI:

```powershell
$env:DATABASE_URL='postgresql+psycopg://unused@127.0.0.1:1/independent_no_database?connect_timeout=2'
$env:POSTGRES_DB='independent_no_database'
$env:OPENAI_API_KEY=''
python -B -m pytest tests/unit tests/api -q -p no:cacheprovider --junitxml=reports/qa69-local.xml -o faulthandler_timeout=15
```

165 passed, exit 0. PostgreSQL integration evidence comes from the dedicated CI service. The synthetic browser reports are in `frontend/test-results/qa69-junit.xml` and `frontend/playwright-report/qa69/index.html`. On a failure the config retains a trace and screenshot in its local output directory. Review URLs, request bodies and screenshots before sharing. The passing run generated the XML and HTML without failure traces. A forced failure and owner manual acceptance remain NOT_RUN.
