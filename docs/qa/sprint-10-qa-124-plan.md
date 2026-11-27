# Sprint 10 — QA-124 — Intelligent Failure Analysis MVP

## Objective

A QA can paste a **synthetic or anonymized** failure message into QualityMind AI, receive an indicative deterministic failure category and a safe next investigation step. No test is executed, no root cause is asserted.

Epic: QA-1. Issue: QA-124. Previous sprint: QA-112 merged as PR #54.

## Slice

- `POST /api/v1/failure-analysis/classify` accepts `{"excerpt": "..."}`.
- Pydantic forbids unexpected fields; input must be 10–2,000 characters and contains no control characters.
- Deterministic first-match precedence TIMEOUT > LOCATOR > ASSERTION > HTTP > UNKNOWN; in case of conflicting clues, this is not a likelihood score.
- Output contains allowlisted classification, clue and suggested validation, `confidence=HEURISTIC`, `review_required=true`, `execution_status=NOT_EXECUTED`.
- Never include log content in the response, persist it, send it to OpenAI, run it, fetch URLs, or read paths.
- Next.js dedicated page `/failure-analysis`, single proxy route, sidebar navigation.
- Unit/API + mocked Playwright tests; CI and manual UAT before merging.

## UAT — isolated QA only

1. **S10-UAT-01:** Open `http://127.0.0.1:3001/failure-analysis`; ensure visible warning and empty input disables Analyze.
2. **S10-UAT-02:** Enter `TimeoutError: locator.waitFor: Timeout 30000ms exceeded`; click Analyze; expect `TIMEOUT`, `HEURISTIC`, human review and `NOT_EXECUTED`.
3. **S10-UAT-03:** Enter `Error: locator not found while testing checkout`; expect `LOCATOR` with suggestion, not alleged root cause.
4. **S10-UAT-04:** Enter `Synthetic checkout returned an unexpected result`; expect `UNKNOWN` and manual review suggestion.
5. **S10-UAT-05:** Swagger send `{"excerpt":"tiny"}`, an unknown field, and 2,001 characters; expect HTTP 422. Plain GET endpoint should be 405. No excerpt must be reflected in success payload.
6. **S10-UAT-06:** Validate isolated QA services, regression checks and no live script execution/AI calls or stored failure text.

**UAT progress (2026-11-26, user-reported, no independent environment replay):**

| Scenario | Result | Evidence |
| --- | --- | --- |
| S10-UAT-01 | PASS (user-reported) | User reported startup and empty-state validation PASS |
| S10-UAT-02 | PASS (user-reported) | User reported TIMEOUT classification PASS |
| S10-UAT-03 | PASS (user-reported) | User explicitly reported LOCATOR PASS |
| S10-UAT-04 | PASS (user-reported) | User explicitly reported UNKNOWN PASS |
| S10-UAT-05 | PASS (user-reported) | User confirmed A:422 short, B:422 forbidden field, C:422 too long, D:405 GET, E:200 success without echo of input; no independent local execution evidence |
| S10-UAT-06 | NOT_RUN | QA isolation, regression CI and no execution verification pending |

S10-UAT-06 remains NOT_RUN; do not mark PASS without execution evidence.

CI follow-up: API Tests failed on commit `5221925` (66 passed, 1 failed): `TimeoutError: synthetic-sensitive-marker exceeded` incorrectly classified as UNKNOWN. Regression test added `89bbd3c`, rule fixed `a8fefb9` to recognize `TimeoutError`; new head CI must pass before release sign-off.

## Deferred

Persisted failure runs, CI ingestion, attachment upload, clustering, root-cause model, recommendation scoring, PII-safe scrubbing, AI provider calls and release gate integration. A future LLM feature requires independent privacy/security review and data minimization, not an implicit opt-in.

## Exit gate

MVP First — Enterprise by Design: Draft PR, CI success, documented UAT and human sign-off **before** merge. No production GO.


## S10-UAT-06 — post-merge validation and supervisor review

**Date:** 2026-11-26 Montreal / 2026-11-27 UTC. **Verdict:** PASS (Codex technical execution report, reviewed by Engineering Supervisor, not independently replayed). **Tested main:** `58bf94a06221e0f04b90c5b0a503c751553809b3`. **Scope:** isolated QA, regression and no script execution, external AI calls or persistence of failure input on exercised paths. S10-UAT-01–05 remain PASS (user-reported). Prior NOT_RUN statements above are historical; this addendum supersedes the current S10-UAT-06 execution status only.

| Evidence | Reported result / limitation |
| --- | --- |
| Temporary clone | HEAD verified by Codex; existing local feature branch and modified frontend/tsconfig.json preserved |
| QA isolation | PostgreSQL 17.11, qualitymind_qa DB and role, 127.0.0.1:5433, QA volume; HTTP 200 on 8001/3001, pre-existing process SHAs unknown |
| Real PostgreSQL / FastAPI harness | 7/7 PASS, exit 0; synthetic classifier requests 200/422/422, TIMEOUT/HEURISTIC, human review and NOT_EXECUTED, no input echo; no SQL execution, external network attempt, process launch or file write detected during instrumented classification requests; rollback verified |
| Regression | 162 PASS, 1 excluded, exit 0 under QA profile; initial CORS test expected DEV origin 3000, QA accepted 3001 and rejected 3000; 2 PASS separately under DEV contract profile with dummy SQL target. Not a single unfiltered all-green run |
| Real browser | 1 PASS, exit 0; temporary Next 13001 and FastAPI 18001 from tested SHA, QA DB read-only, POST 200, TIMEOUT/NOT_EXECUTED, no input marker echoed; temporary processes stopped. Versioned mock-api test is separate simulated evidence |
| Other modules | Requirements create/read, HIGH risk, DRAFT test design reread, script association without execution, governance UNDETERMINED then NO_GO on critical FAIL; API/SQL only, no claim of full UI regression |
| Scope limits | Only exercised paths and instrumented interfaces; no independently inspected raw logs/artifacts or replay by Supervisor; no paid OpenAI calls, destructive DB operations, application changes, merge or deployment reported |

**Independently verified repository metadata:** [PR #55](https://github.com/AstuceByMouna/qualitymind-ai/pull/55) merged at `ec6cbf642166dd41b6ca4b3a14fc4fc6b96fa355`; five returned PR workflows succeeded at candidate `a57a09315ba9c1ce8ec2b00ce1c2705316f68187`. [Comparison](https://github.com/AstuceByMouna/qualitymind-ai/compare/ec6cbf642166dd41b6ca4b3a14fc4fc6b96fa355...58bf94a06221e0f04b90c5b0a503c751553809b3) shows 20 commits and seven documentation/governance files only. No PR-triggered workflow returned for the tested main SHA; do not equate historical CI with that SHA's CI.

**Process deviation S10-DEV-01 (RP-092):** functional PR #55 was merged before documented acceptance of S10-UAT-06. Post-merge technical PASS does not retroactively satisfy the pre-merge gate. Preserve actual sequence; no backdating or retrospective compliance claim. Prevent recurrence: require documented P0 UAT acceptance, exact candidate CI/review and explicit owner merge authorization before future functional merges. Track the deviation in [QA-124](https://gharbiconsulting.atlassian.net/browse/QA-124) and QA-125; owner acknowledgement of residual process deviation and functional acceptance required before closure. No production GO. QA-124 remains In Progress pending recorded review/acceptance and reconciliation.
