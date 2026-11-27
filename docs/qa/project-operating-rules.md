# QualityMind AI — Canonical operating rules (QA-125)

**Status:** Binding project working agreement. **Owner:** project QA lead. **First consolidated:** 2026-11-26. **Source of truth:** this versioned file, in conjunction with Jira acceptance criteria, the active ADRs, DoR/DoD, and UAT sign-off. These rules govern all subsequent sprints, including process changes.

## 1. Product and scope

- **MVP First — Enterprise by Design:** One end-to-end business capability per sprint; get to a first deployable, demonstrable MVP rather than perfecting one module. Defer optional polish and complexity to prioritized Jira backlog.
- Do **not** defer essential security, privacy, data integrity, authorization boundaries, validation, critical tests, source provenance or minimum traceability.
- Modular monolith (ADR-001), FastAPI/Python, PostgreSQL, Next.js, Pytest, Playwright; keep the existing architecture and modules unless an explicit ADR changes them.
- Product lifecycle: Requirements Intelligence → AI Test Design → Risk-Based Testing → Automation Hub → Intelligent Failure Analysis → Quality Governance; preserve bidirectional traceability from business needs/rules through tests and evidence.
- **QA Foundation Builder** augments, not replaces, this platform: reconstruct source-grounded QA knowledge from scattered docs for consultant-led QA diagnostic/foundation services, then use the same versioned artifacts across continuous QA. SaaS expansion is a later business decision.
- Living specification vision: versioned structured source files generate navigable Business Capabilities → Business Functions → Process Activities → Business Rules → Test Cases and component dependency/impact views. No manual maintenance of duplicate static catalogs. Keep future items QA-108/109 and traceability QA-44 visible in backlog; do not claim these are implemented yet.
- QA Foundation MVP: prioritize source inventory QA-114, text-first document import QA-115, sourced extraction QA-116, clarification QA-117, deliverable export/sign-off story to be defined. Defer audio/live voice QA-118/121, automatic change propagation QA-120 until QA-44/109 foundations, dashboard QA-122, and unnecessary enterprise polish.

## 2. Rules for every sprint and Jira backlog

1. At **sprint start**, inspect current board/sprints/backlog, create a named Jira sprint and identify one clear P0 vertical slice with owner, parent epic/FR, risks, DoR, detailed acceptance criteria, UAT scenarios and explicit deferrals. Assign new work to the sprint and update the ticket to In Progress when work actually begins.
2. **Keep Jira live**: add issue ↔ branch ↔ PR ↔ exact commit ↔ CI run ↔ UAT evidence links and sync status at each major milestone; update issue comments as soon as testing reveals an anomaly or decision. Create a Bug for observed defects; triage blocking severity instead of silently ignoring it.
3. Separate **epics/FR coverage** from their MVP implementing slices. A parent FR remains OPEN or PARTIAL if required advanced behaviors have not been delivered. Document exactly what is implemented and what remains, with links, rather than blanket-closing parents.
4. Close a sprint only after reviewing all its issues and recording unfinished carryover. Do not backdate or create fake historical sprints, fabricate burndown, or misclassify old work as completed in a new period. Missing historical sprints are a **documented process deviation**, supported by PR/UAT records.
5. Every new rule/decision must be applied from then on **and added to this file, the relevant ADR, or the sprint decision log**, with date, rationale and supersession when applicable. Review these rules at every sprint kickoff and release decision. If rules conflict, explicitly reconcile before implementation; never silently drop earlier commitments.

## 3. Delivery and review

6. Use a dedicated branch and **Draft PR** per coherent increment. Prefer one actual working user journey per sprint over perfect UX; record limitations and defer noncritical improvements in Jira.
7. Before touching existing code, inspect current repository state, affected interfaces, migrations and test behavior. Do not overwrite other work. Keep changes minimal, traceable and reversible.
8. Tests as evidence: unit + API/integration + Playwright for relevant functionality; negative validation and isolation checks. Keep test environments isolated from DEV/production (`qualitymind_qa` at `127.0.0.1:5433`, API :8001, UI :3001); synthetic disposable fixtures only. Run Alembic migrations and reversibility/drift checks for schema changes when applicable.
9. **CI actual status**: enumerate checks on the exact current HEAD after the final code/doc change; distinguish SUCCESS, FAILURE, QUEUED, NOT_RUN and NOT_APPLICABLE. A success on an earlier SHA does not qualify a later SHA. Investigate failures using logs, fix and add regression coverage; never claim or imply tests passed without execution.
10. Record **manual UAT** with case ID, expected/actual, environment, evidence (logs/screenshot), and result. If only the user says PASS, write **PASS (user-reported)**, not independently verified; do not infer PASS for steps not separately confirmed. Any FAIL/UNKNOWN/BLOCKED is handled visibly. A mocked Playwright test is **SIMULATED** evidence, not proof of real DB or release readiness.
11. **No merge until CI green, P0 UAT accepted, blocking defects addressed or explicitly risk-accepted and release decision documented.** Obtain user authorization for merge; avoid silently merging. A merged PR is not a production GO. Production release requires a separate security/operations/release approval.
12. Use plain explanations and reproducible Windows Git Bash commands for local QA when user needs to execute; assistant performs eligible Jira/GitHub work, not just prescribes it, but never pretends to have run local commands.
13. Documentation: update sprint plans, architecture/ADR, UAT, traceability, GitHub and Confluence where applicable. Reconcile backlog after each merge, and create the next sprint in Jira before starting new implementation.

## 4. AI, evidence, governance and privacy

14. OpenAI API usage in automated tests is **not permitted by current project decision**: OpenAI tests are manual only. Use structured outputs and schema validation with explicit consent, human review and cost controls when AI functionality is enabled. No background paid model calls during CI.
15. Consent and data minimization: no customer secrets, payment information, identifiable production records or raw client logs in examples or tests. Source-grounded claims must have provenance and a human validation state; uncertainty/unknown must never be silently converted to success.
16. No autonomous test execution or false `PASS`: a linked Playwright script is just metadata until an actual run and immutable evidence exist. Separate manual vs automated test type, script readiness and execution results in future backlog; do not conflate these states.
17. Governance: AI may **challenge** release decisions and present risk/evidence, but cannot auto-approve a release or override a critical FAIL, stale evidence or a missing review. Track release version, deterministic evidence ordering and auditable human decisions.
18. QA Foundation consultations: client confidentiality, contract/permission and applicable Quebec privacy impact assessment; provider 'no training' and Zero Data Retention are not interchangeable. Use synthetic/anonymized data until properly authorized. Measure source coverage/precision, hallucination rate, cost and latency before enabling autonomous extraction at scale.

## 5. Continuity and accountability

- At each new chat, kickoff, PR, merge or user change request, re-read this agreement and the latest Jira/GitHub state. If a user adds a rule, document it in a PR or issue in that session; maintain prior compatible decisions rather than only acknowledging them.
- If an operation cannot be completed, report what was and was not updated, the blocker, and the exact remaining item; do not claim the process or a sprint is complete.
- Historical lesson: after Sprint 6 Jira sprints 7–9 were not created even though PRs were merged. Correct through factual retrospective records, never falsify sprint history. This process guard is mandatory beginning Sprint 10.

## Related canonical sources

- [Definition of Done](definition-of-done.md)
- [Test strategy](test-strategy.md)
- [Sprint 8 UAT](sprint-8-qa-111-uat.md)
- [Sprint 9 UAT](sprint-9-qa-112-uat.md)
- [Sprint 7–10 reconciliation](backlog-reconciliation-s7-s10.md)
- Jira QA-125, QA-113, QA-124; GitHub PR #51, #52, #53, #54, #55.
