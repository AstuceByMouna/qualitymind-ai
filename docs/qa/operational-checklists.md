# Operational checklists — Lean AI Engineering Governance

Decision: 2026-11-26 Montreal. QA-125. Candidate on PR #56. Read with the [approved operating layer and historical rule register](project-operating-rules.md#7-lean-ai-engineering-governance--approved-operating-layer-qa-125) and [DoR/DoD](definition-of-done.md).

## 1. Risk classification
- L1 Minor: documentation, typo, presentation-only change with no behavioral, accessibility, contract, data or security impact. Review the diff and applicable CI; explain test N/A. A functional UI correction is L2 or L3, not L1.
- L2 Functional: business behavior, API, functional UI or ordinary bug fix. Jira/FR/AC, impact, branch/Draft PR, targeted unit/API/integration/E2E as applicable, exact-head CI, P0 UAT and explicit merge authorization.
- L3 Critical: architecture, authentication/authorization, privacy, AI, persistence/migrations, test execution, release decision policy or deployment. L2 plus relevant threat/data analysis, ADR where needed, migration/recovery, security, regression and evidence review. Major changes and production require separate explicit approval.
- Default to higher level if uncertain. Reclassify on new risk. No lower level waives existing authorization, mandatory CI, essential tests, or privacy requirements.

## 2. Event-based preflight
| Event | Required checks |
| --- | --- |
| Discussion without writes | Relevant context only; label unknowns; no execution claim. |
| Resume development | Read applicable AGENTS, identify rule version, Git status/branch/HEAD, protect changes, relevant Jira scope, applicable decisions. |
| New functional task | Above plus requirements, AC, risk, dependencies, test plan and relevant Confluence/ADR. |
| Within authorized task | Reuse verified unchanged references; recheck mutable affected records before each write; stop on conflict. |
| Sprint start/end | Full GitHub/Jira/Confluence reconciliation, actual sprint, backlog pagination, requirements, decisions, evidence and carryover. |
| Any merge | Verify actual candidate, required checks, review and explicit authorization; for functional merge also cross-system reconciliation and P0 UAT. |
| Release | Full cross-system, security, operations, evidence and separate deployment approval. |

Missing or conflicting required sources block affected writes. Until supervisor plugin instructions are aligned, follow its stricter Gate 0. Do not bypass local or platform permissions.

## 3. Execution and closure
1. Confirm authorized scope, Jira and risk level. Use one Jira-linked branch/Draft PR; no direct main writes.
2. Inspect affected contracts and preserve local work. Apply relevant tests, synthetic fixtures, verified QA DB identity before tests/migrations. Automated AI tests use mocks; no real paid OpenAI calls.
3. Record only actual results, exact candidate SHA, environment and evidence link; label user-reported and simulated results; justify NOT_APPLICABLE.
4. For functional PR, P0 UAT accepted and documented before merge (RP-092). All required checks and review must pass; explicit owner merge approval required for every PR. Documentation-only review is not functional UAT.
5. Synchronize Jira/PR/docs at relevant milestones, not every trivial edit. Retain open FRs for partial work, defects, risks and carryover. Verify main after authorized merge.
6. Production requires separate explicit approval and verified security/operational readiness; no automatic GO.

## 4. Delegation and automation
Authorized routine implementation, isolated tests, issue/document updates and Draft PR preparation need no repeated owner approval within scope. Escalate major architecture/product changes, rule changes, paid live AI tests, merge, deployment, unexpected critical impact or insufficient authorization.

Prefer existing CI, Rulesets, QA isolation script and schema checks; propose commit/Jira link validation, generated traceability/diagrams and milestone reports in backlog if absent. Verify automation availability; no unimplemented check is PASS. No new automation implementation is authorized by this documentation change alone.

## 5. Minimal handoff record
Jira / scope / risk level / branch / exact HEAD / changed files / applicable tests and evidence / unresolved risks / approval required. Link to canonical sources rather than duplicate their contents.

## 6. Efficiency measurement
Record preflight time, repeated manual reporting, missed controls and rework over subsequent sprints; compare against a measured baseline. No efficiency improvement claimed yet.


## 7. Operational handoff checklist — RP-112 (QA-129)
- [ ] Ticket/branch, exact SHA, source links and current state verified; provide Git status/fetch/synchronization commands and protect local changes/stashes. Stop on unexpected differences.
- [ ] Provide applicable isolated DB, backend and frontend startup and health-check commands; identify environment, ports and database. If a service is unnecessary, mark N/A with rationale. Reuse verified running services when unchanged; do not restart needlessly.
- [ ] Give reproducible validation steps with test data, expected results and evidence to record. Distinguish NOT_RUN, simulated, reported and observed results. Respect RP-111: Codex implements and executes tests; Supervisor reviews evidence.
- [ ] When a merge is required, verify exact-head CI, review and applicable documented P0 UAT, then explicitly request owner authorization under RP-092. No automatic merge or deployment.
