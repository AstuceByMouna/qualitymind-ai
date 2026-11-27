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
| S10-UAT-05 | NOT_RUN | Swagger negative API validation pending |
| S10-UAT-06 | NOT_RUN | QA isolation, regression CI and no execution verification pending |

Do not mark remaining scenarios PASS without execution evidence.

## Deferred

Persisted failure runs, CI ingestion, attachment upload, clustering, root-cause model, recommendation scoring, PII-safe scrubbing, AI provider calls and release gate integration. A future LLM feature requires independent privacy/security review and data minimization, not an implicit opt-in.

## Exit gate

MVP First — Enterprise by Design: Draft PR, CI success, documented UAT and human sign-off **before** merge. No production GO.
