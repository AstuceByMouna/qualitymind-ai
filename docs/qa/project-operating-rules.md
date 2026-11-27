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


## 6. Approved permanent-rule index — QA-125

**Decision record:** 2026-11-26 Montreal / 2026-11-27 UTC. The project owner explicitly approved the 110-rule consolidation, mandatory pre-merge P0 UAT, preparation of PR #56 documentation and Confluence reconciliation, and keeping QA-124 In Progress until S10-UAT-06 is validated. No merge or deployment was authorized. This decision is effective for subsequent work; repository publication remains pending review and merge. The preceding sections are preserved verbatim. The index is part of this same agreement, not a competing policy.

**Approval/provenance convention:** all RP entries below are accepted as part of this consolidation on the decision date. Source codes identify the historical source families, not a claim that every individual historical approval date was recovered. Original approval dates not evidenced remain unknown; architecture or product implementation status is separate (e.g. ADR-003/004 remain Proposed in the historical registry, FR-037–039 remain candidate, and QA Foundation remains backlog). No retroactive ratification or proof of execution is inferred. New entries must identify owner, status, effective date, source, scope, rationale, verification and supersession where applicable. Do not renumber existing IDs.

### Product and scope

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-001 | Apply MVP First — Enterprise by Design. | O1, CAT, ADR, VISION |
| RP-002 | Deliver one functional end-to-end increment per sprint. | O1, CAT, ADR, VISION |
| RP-003 | Prioritize the first demonstrable version over perfection of each module. | O1, CAT, ADR, VISION |
| RP-004 | Defer nonessential improvements into Jira with rationale. | O1, CAT, ADR, VISION |
| RP-005 | Never defer essential security, integrity, privacy or validation controls. | O1, CAT, ADR, VISION |
| RP-006 | Distinguish target platform, implemented MVP and production-authorized release. | O1, CAT, ADR, VISION |
| RP-007 | Retain the six original functional modules. | O1, CAT, ADR, VISION |
| RP-008 | Integrate QA Foundation Builder progressively without replacing existing modules. | O1, CAT, ADR, VISION |
| RP-009 | Preserve the living business specification vision generated from versioned sources. | O1, CAT, ADR, VISION |
| RP-010 | Preserve the senior QA Architect portfolio demonstration objective. | O1, CAT, ADR, VISION |

### Continuity

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-011 | Read AGENTS.md before every resumption. | O5, AG, SUP, OWNER |
| RP-012 | Verify actual GitHub, Jira and Confluence state before intervening. | O5, AG, SUP, OWNER |
| RP-013 | Never rely solely on conversation memory for project state. | O5, AG, SUP, OWNER |
| RP-014 | Apply every newly approved rule to subsequent work. | O5, AG, SUP, OWNER |
| RP-015 | Never silently remove or forget a previously approved rule. | O5, AG, SUP, OWNER |
| RP-016 | Version new decisions with date, rationale, provenance and impact. | O5, AG, SUP, OWNER |
| RP-017 | Escalate conflicts for arbitration and preserve the replaced rule's history. | O5, AG, SUP, OWNER |
| RP-018 | Report unavailable information and unperformed operations explicitly. | O5, AG, SUP, OWNER |
| RP-019 | Perform authorized tasks directly when access permits. | O5, AG, SUP, OWNER |
| RP-020 | Communicate in French; write new technical artifacts in English under the supervisor protocol. | O5, AG, SUP, OWNER |

### Scrum and backlog

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-021 | Create and activate the Jira sprint before implementation starts. | O2, SDLC, REC, QA-125 |
| RP-022 | Define sprint goal, P0 scope, dependencies and acceptance criteria. | O2, SDLC, REC, QA-125 |
| RP-023 | Assign issues to the corresponding sprint. | O2, SDLC, REC, QA-125 |
| RP-024 | Keep Jira statuses current throughout the sprint. | O2, SDLC, REC, QA-125 |
| RP-025 | Review remaining issues from previous sprints. | O2, SDLC, REC, QA-125 |
| RP-026 | Record defects found during UAT. | O2, SDLC, REC, QA-125 |
| RP-027 | Do not close an entire requirement when only a subset is delivered. | O2, SDLC, REC, QA-125 |
| RP-028 | Review and reconcile the backlog after each integration. | O2, SDLC, REC, QA-125 |
| RP-029 | Record deferred improvements and functionality. | O2, SDLC, REC, QA-125 |
| RP-030 | Prepare a UAT campaign for each sprint. | O2, SDLC, REC, QA-125 |
| RP-031 | Close sprints after reviewing results, defects and carryover. | O2, SDLC, REC, QA-125 |
| RP-032 | Never backdate sprints or fabricate Scrum metrics. | O2, SDLC, REC, QA-125 |

### Development and GitHub

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-033 | Preserve the approved modular architecture. | O3, SDLC, ADR, DOD, SUP |
| RP-034 | Inspect existing code and interfaces before changing them. | O3, SDLC, ADR, DOD, SUP |
| RP-035 | Synchronize the starting branch and protect local changes. | O3, SDLC, ADR, DOD, SUP |
| RP-036 | Create a dedicated branch linked to the Jira issue. | O3, SDLC, ADR, DOD, SUP |
| RP-037 | Use Conventional Commits with a Jira reference. | O3, SDLC, ADR, DOD, SUP |
| RP-038 | Open a Draft Pull Request for each increment. | O3, SDLC, ADR, DOD, SUP |
| RP-039 | Do not develop directly on main. | O3, SDLC, ADR, DOD, SUP |
| RP-040 | Review the diff, dependencies, risks and migrations. | O3, SDLC, ADR, DOD, SUP |
| RP-041 | Never expose API keys, secrets or customer data. | O3, SDLC, ADR, DOD, SUP |
| RP-042 | Do not overwrite existing user changes. | O3, SDLC, ADR, DOD, SUP |
| RP-043 | Do not merge without required validations and authorization. | O3, SDLC, ADR, DOD, SUP |
| RP-044 | Never claim local commands were executed without evidence. | O3, SDLC, ADR, DOD, SUP |
| RP-045 | Maintain coherent, minimal, versioned technical documentation. | O3, SDLC, ADR, DOD, SUP |

### Quality engineering

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-046 | Define requirement coverage before validation. | O3, DOD, QA, S8, SUP |
| RP-047 | Apply risk-based testing. | O3, DOD, QA, S8, SUP |
| RP-048 | Run applicable unit tests. | O3, DOD, QA, S8, SUP |
| RP-049 | Verify API contracts with Pytest, HTTPX and Postman as applicable. | O3, DOD, QA, S8, SUP |
| RP-050 | Verify real integration with isolated PostgreSQL. | O3, DOD, QA, S8, SUP |
| RP-051 | Automate critical UI journeys with Playwright. | O3, DOD, QA, S8, SUP |
| RP-052 | Cover negative cases, boundaries, duplicates and errors. | O3, DOD, QA, S8, SUP |
| RP-053 | Add regression coverage for significant fixes. | O3, DOD, QA, S8, SUP |
| RP-054 | Use synthetic test data. | O3, DOD, QA, S8, SUP |
| RP-055 | Strictly isolate DEV, QA and automated test databases. | O3, DOD, QA, S8, SUP |
| RP-056 | Verify database identity before tests or migrations. | O3, DOD, QA, S8, SUP |
| RP-057 | Verify migration reversibility when applicable. | O3, DOD, QA, S8, SUP |
| RP-058 | Avoid shared fixtures that cause conflicts between parallel tests. | O3, DOD, QA, S8, SUP |
| RP-059 | Distinguish mocked tests from real integration tests. | O3, DOD, QA, S8, SUP |
| RP-060 | Run CI on the exact merge candidate. | O3, DOD, QA, S8, SUP |
| RP-061 | Green CI on an earlier commit does not validate a later one. | O3, DOD, QA, S8, SUP |
| RP-062 | Record PASS, FAIL, BLOCKED and NOT_RUN; use NOT_APPLICABLE with justification. | O3, DOD, QA, S8, SUP |
| RP-063 | Label user-reported PASS separately. | O3, DOD, QA, S8, SUP |
| RP-064 | Never fabricate test results or evidence. | O3, DOD, QA, S8, SUP |
| RP-065 | Distinguish requirement coverage, execution result and business acceptance. | O3, DOD, QA, S8, SUP |
| RP-066 | Never represent AI-assisted review as independent human audit. | O3, DOD, QA, S8, SUP |

### AI and privacy

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-067 | Real OpenAI tests are manual only. | O4, AI, CAT, REL, QA-90 |
| RP-068 | No automated paid OpenAI calls in CI. | O4, AI, CAT, REL, QA-90 |
| RP-069 | Use mocks for automated AI integration tests. | O4, AI, CAT, REL, QA-90 |
| RP-070 | Obtain explicit consent before authorized external calls. | O4, AI, CAT, REL, QA-90 |
| RP-071 | Minimize data sent to the AI provider. | O4, AI, CAT, REL, QA-90 |
| RP-072 | Use Structured Outputs and backend Pydantic validation. | O4, AI, CAT, REL, QA-90 |
| RP-073 | Reject or explicitly handle invalid AI responses. | O4, AI, CAT, REL, QA-90 |
| RP-074 | Do not invent business rules or acceptance criteria absent from sources. | O4, AI, CAT, REL, QA-90 |
| RP-075 | Retain source, model and version metadata where applicable. | O4, AI, CAT, REL, QA-90 |
| RP-076 | Require human review of AI proposals. | O4, AI, CAT, REL, QA-90 |
| RP-077 | AI proposals must not automatically modify approved requirements. | O4, AI, CAT, REL, QA-90 |
| RP-078 | Do not represent basic sensitive-data detection as certified DLP. | O4, AI, CAT, REL, QA-90 |
| RP-079 | Control real-call budgets and protect the API key on the backend. | O4, AI, CAT, REL, QA-90 |
| RP-080 | Do not transmit real customer data without appropriate controls and authorization. | O4, AI, CAT, REL, QA-90 |

### Release management

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-081 | Quality Gates must be deterministic. | O3, O4, DC, REL, OWNER |
| RP-082 | An LLM must not approve a release alone. | O3, O4, DC, REL, OWNER |
| RP-083 | An applicable critical FAIL causes NO_GO. | O3, O4, DC, REL, OWNER |
| RP-084 | Missing or stale evidence must not become PASS. | O3, O4, DC, REL, OWNER |
| RP-085 | Associate evidence with the correct release version. | O3, O4, DC, REL, OWNER |
| RP-086 | An active, applicable, qualified CRITICAL objection causes NO_GO. | O3, O4, DC, REL, OWNER |
| RP-087 | Unqualified objections must not automatically block release. | O3, O4, DC, REL, OWNER |
| RP-088 | HIGH, MEDIUM and LOW objections require human review. | O3, O4, DC, REL, OWNER |
| RP-089 | Preserve traceability of objection resolution and rejection. | O3, O4, DC, REL, OWNER |
| RP-090 | Preserve prototype decisions NO_GO, UNDETERMINED and REVIEW_REQUIRED. | O3, O4, DC, REL, OWNER |
| RP-091 | No automatic GO is permitted. | O3, O4, DC, REL, OWNER |
| RP-092 | P0 UAT must be accepted and documented BEFORE any functional PR merge. | O3, O4, DC, REL, OWNER |
| RP-093 | Required CI and review must pass before merge. | O3, O4, DC, REL, OWNER |
| RP-094 | A merged PR is not functional acceptance. | O3, O4, DC, REL, OWNER |
| RP-095 | Local functional acceptance is not production authorization. | O3, O4, DC, REL, OWNER |
| RP-096 | Production deployment requires explicit approval and appropriate security controls. | O3, O4, DC, REL, OWNER |

### Traceability and documentation

| ID | Approved rule | Source families |
| --- | --- | --- |
| RP-097 | Maintain end-to-end business, technical and QA traceability. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-098 | Use stable identifiers for requirements, rules, tests and decisions. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-099 | Maintain bidirectional links where available. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-100 | Synchronize GitHub, Jira and Confluence at major milestones. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-101 | Maintain the official requirements catalog. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-102 | Version ADRs and never reuse identifiers. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-103 | Distinguish Proposed, Accepted, Superseded and Rejected decisions. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-104 | Maintain relevant functional, technical and data diagrams. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-105 | Document UAT results by scenario and version. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-106 | Retain defects, residual risks and acceptance reservations. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-107 | Prefer versioned specifications as the source of generated views. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-108 | Do not maintain conflicting duplicate catalogs. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-109 | Do not treat script association as execution evidence. | O1, O2, O3, ADR, CAT, VISION, SUP |
| RP-110 | Do not treat a DRAFT test as validated coverage. | O1, O2, O3, ADR, CAT, VISION, SUP |

### Source index (observed during the 2026-11-26 audit)

- O1/O2/O3/O4/O5: existing sections 1–5 of this file, preserved at baseline [73a8e98](https://github.com/AstuceByMouna/qualitymind-ai/blob/73a8e98d519cefb4de55d0e72ef6decf175c538e/docs/qa/project-operating-rules.md).
- AG: [candidate AGENTS.md](https://github.com/AstuceByMouna/qualitymind-ai/blob/73a8e98d519cefb4de55d0e72ef6decf175c538e/AGENTS.md), blob c00725b7ca80b0a459216b54fea2402b529e90b4; default-branch read returned 404 at audit.
- SDLC: [Confluence 458753](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458753), v4; QA: [425986](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/425986), v4; DOD: [repository DoR/DoD](definition-of-done.md), baseline blob 8a629ce0f2efc282b0d21363d758bc8a1946ebeb.
- ADR: [canonical ADR registry 2129927](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2129927), v2; CAT: [catalog 262145](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145), v7; AI: [AI governance 2129964](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2129964), v1; REL: [MVP-1 release 2162844](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2162844), v2.
- DC: [QA-103 policy 3080208](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/3080208), v22, and [Sprint 6 2818093](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2818093), v10; S8: [Sprint 8 4096023](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/4096023), v6 and [PR #53](https://github.com/AstuceByMouna/qualitymind-ai/pull/53).
- REC: [reconciliation](backlog-reconciliation-s7-s10.md); QA-125 and QA-90: corresponding Jira issues; VISION: QA-108/109/110, QA-44, QA-113 and prior project discussions accessible at audit.
- OWNER: explicit project-owner approval in the audit follow-up dated 2026-11-26 Montreal; SUP: engineering supervisor mandatory gates used in this audit. Conversation and plugin instructions are not independent test evidence.

### Explicit precedence and verification

RP-092 supersedes the older operational sequence in Confluence SDLC v4 and QA v4 which allowed local UAT after merge; preserve those passages as historical practice, including PR #51/#52 sequencing deviations. For functional changes: Draft PR → exact-head CI → P0 UAT acceptance with evidence and blocking issues resolved or explicitly risk-accepted within policy → required review and explicit owner merge authorization → merge → verify main and reconcile Jira/Confluence. A documentation-only change uses a relevant documented review/CI gate rather than fabricated functional UAT. No automatic production GO. The owner approved preparation, not publication/merge or production deployment.

QA-124 remains In Progress; S10-UAT-06 remains NOT_RUN until verified. QA-125 remains In Progress until its documentation, review and reconciliation gates are met. Do not infer a release decision from approval of this index.

**Known audit limits:** historical conversation access was partial, nested AGENTS inventory and local environment were not established, and not all Confluence revisions or historical test artifacts were inspected. Preserve any additional verified historical rule; do not treat the 110 entries as proof of exhaustive recovery. When an apparent conflict or missing source is found, record and resolve it before expanding write scope.


## 7. Lean AI Engineering Governance — approved operating layer (QA-125)

**Decision:** 2026-11-26 Montreal / 2026-11-27 UTC. **Owner:** project owner. **Status:** owner-approved in conversation; candidate publication on PR #56 pending review, exact-head CI and explicit merge authorization. **Rationale:** reduce repeated checks and documentation overhead while preserving risk controls and the first demonstrable MVP. All 110 original identifiers and historical text are preserved. The principles are operational navigation, not a replacement for detailed rules, ADRs or DoD except the limited cadence supersession below.

| Principle | Operational summary | Original rule IDs |
| --- | --- | --- |
| LG-01 — MVP First — Enterprise by Design | One end-to-end increment per sprint; defer optional work with rationale; preserve six modules, Foundation Builder, living specifications and portfolio goals; distinguish target, implemented and authorized release; never defer essential controls. | RP-001, RP-002, RP-003, RP-004, RP-005, RP-006, RP-007, RP-008, RP-009, RP-010 |
| LG-02 — Continuity and accountability | Read applicable instructions, verify relevant live sources, preserve decisions with provenance and supersession, disclose gaps, execute authorized work; French communication and English technical artifacts. | RP-011, RP-012, RP-013, RP-014, RP-015, RP-016, RP-017, RP-018, RP-019, RP-020 |
| LG-03 — Lean project management | Activate real sprints before implementation; scope, assign, update, review carryover, defects and deferrals; retain partial FR status, prepare UAT and reconcile before closure; never fabricate history. | RP-021, RP-022, RP-023, RP-024, RP-025, RP-026, RP-027, RP-028, RP-029, RP-030, RP-031, RP-032 |
| LG-04 — Controlled software engineering | Preserve architecture, inspect code, synchronize and protect local changes, Jira branch, Conventional Commits, Draft PR, diff review; no direct main development; minimal versioned docs. | RP-033, RP-034, RP-035, RP-036, RP-037, RP-038, RP-039, RP-040, RP-042, RP-045 |
| LG-05 — Security, privacy and isolation | Protect secrets and customer data, minimize provider data, synthetic fixtures, isolated DEV/QA/test DB, verify DB identity and applicable migration reversibility, avoid parallel fixture conflicts; backend secrets and budget control; no unsupported DLP or unauthorized customer data. | RP-041, RP-054, RP-055, RP-056, RP-057, RP-058, RP-071, RP-078, RP-079, RP-080 |
| LG-06 — Evidence integrity | No fabricated results or commands; distinguish mocks, real executions, user reports, coverage and acceptance; verify candidate SHA and scenario/version evidence; script links and DRAFT are not execution/validated coverage; AI review is not independent audit. | RP-044, RP-059, RP-060, RP-061, RP-062, RP-063, RP-064, RP-065, RP-066, RP-105, RP-109, RP-110 |
| LG-07 — Risk-based quality engineering | Define requirement coverage; applicable unit, API, isolated integration and critical Playwright tests; negatives, boundaries, duplicates, errors and meaningful regression. | RP-046, RP-047, RP-048, RP-049, RP-050, RP-051, RP-052, RP-053 |
| LG-08 — Responsible AI engineering | Real OpenAI tests manual and explicitly authorized only; automated tests mocked, no paid CI calls; structured outputs, backend validation, invalid response handling, source/model/version metadata and human review; no invented rules or automatic approved requirement changes. | RP-067, RP-068, RP-069, RP-070, RP-072, RP-073, RP-074, RP-075, RP-076, RP-077 |
| LG-09 — Decision assurance | Deterministic gates; critical FAIL or active applicable qualified CRITICAL objection means NO_GO; missing/stale evidence never PASS; release-version evidence; unqualified objections not automatic blocks, other objections reviewed, resolutions traced; preserve NO_GO/UNDETERMINED/REVIEW_REQUIRED; no automatic GO. | RP-081, RP-082, RP-083, RP-084, RP-085, RP-086, RP-087, RP-088, RP-089, RP-090, RP-091 |
| LG-10 — Controlled release | Required review and exact-head CI, accepted documented P0 UAT before functional merge; blocking defects resolved or explicitly risk-accepted within policy; explicit owner merge approval; merge not acceptance or production permission; separate explicit production approval and security controls. | RP-043, RP-092, RP-093, RP-094, RP-095, RP-096 |
| LG-11 — End-to-end traceability | Stable IDs, bidirectional links, business-to-evidence traceability; views generated from versioned sources; no conflicting duplicate catalogs. | RP-097, RP-098, RP-099, RP-107, RP-108 |
| LG-12 — Living documentation | Synchronize major milestones; maintain official catalog, stable ADR IDs/statuses, relevant diagrams, residual risks, defects and reservations; retain historical decisions. | RP-100, RP-101, RP-102, RP-103, RP-104, RP-106 |

**Limited supersession:** RP-011/RP-012 and section 5 recurring full-read/full-system cadence are refined by the risk-based preflight in [Operational checklists](operational-checklists.md). Read applicable AGENTS instructions at resumption; verify relevant live state before writes; complete cross-system checks at sprint start/end, functional merge and release, and when scope, dependencies, decisions or evidence become uncertain. Within a bounded authorized task reuse verified references if unchanged; recheck relevant mutable state before each mutation. Simple discussion is not write authorization. Missing sources or conflicting instructions affecting the operation block it. No exception to safety, required checks or approval gates. Until the installed supervisor preflight is aligned, its stricter protocol continues to apply in that context; this amendment does not update the plugin.

**Delegation:** within explicitly authorized scope, agents may make ordinary technical decisions, targeted fixes, isolated tests, issue/documentation updates and Draft PR preparation without repeated approvals. Major architecture/product changes, permanent rule changes, real paid OpenAI tests, merge and production deployment still require explicit approval. No authority to overwrite unrelated work or publish outside scope. Newly discovered critical impact triggers reclassification and escalation when authorization is insufficient.

**Non-negotiable:** security/privacy/isolation, evidence integrity, exact-head CI, RP-092 P0 UAT before functional merge, explicit merge approval, no automated real OpenAI testing, deterministic release gates, no automatic GO, critical decision traceability and explicit production approval. Documentation-only work requires appropriate review and CI, not fabricated functional UAT. QA-124 and S10-UAT-06 NOT_RUN are unchanged.

**Verification:** mapping covers RP-001 through RP-110 exactly once; verify historical text preservation and record review/CI for this candidate. Measure preflight effort, repeated reporting and missed-control defects in future sprints before asserting efficiency gains. No merge or deployment authorized.


## 8. Supervisor–Codex responsibility boundary (QA-125)

**Decision:** 2026-11-26 Montreal / 2026-11-27 UTC. **Owner:** project owner. **Source:** explicit instructions that the Supervisor handles documentation and governance only and prepares a Codex prompt whenever development is required. **Status:** approved operating instruction; repository publication pending review and explicit merge approval. **Impact:** narrows delegation in section 7 and RP-019 for this collaboration; preserves the original 110 rules and 12 principles.

| ID | Approved rule | Source / mapping |
| --- | --- | --- |
| RP-111 | Engineering Supervisor owns business analysis, planning, requirements, architecture/design, documentation, Jira/Confluence, traceability and review of actual evidence. Codex executes software implementation, migrations, debugging and software tests through an authorized mission. For every technical task, the Supervisor provides a ready-to-use Codex prompt with ticket, scope, acceptance criteria, applicable risks/constraints, evidence and recommended model/reasoning effort subject to availability. The Supervisor does not perform application development or execute software tests. | Owner instruction; LG-02, LG-04, LG-07, LG-12 |

The Supervisor may maintain documentation-only GitHub branches/Draft PRs and review CI results without invoking software tests itself. No automatic cross-chat delegation or evidence transfer is assumed. All merge and production approvals, security constraints, isolated QA, manual-only authorized paid OpenAI calls, and evidence integrity remain unchanged. No application code, migrations or software tests are authorized by this documentation update. QA-124 remains In Progress pending S10-UAT-06 evidence.
