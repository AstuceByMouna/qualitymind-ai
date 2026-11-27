## Jira, scope and risk
- Jira issue/epic/FR:
- P0 vertical slice and explicit non-scope:
- Source/version and privacy/consent risks:

## Verification and evidence
- [ ] Unit/API/integration tests as applicable (exact command + evidence):
- [ ] UI Playwright (real vs mocked clearly distinguished):
- [ ] CI checks verified on **this HEAD SHA**:
- [ ] Migrations up/down/up + drift if applicable:
- [ ] QA isolated environment and no production/customer data:
- [ ] UAT test matrix, actual outputs and PASS/FAIL/BLOCKED/NOT_RUN:
- [ ] Every user-reported PASS explicitly labelled:
- [ ] Blocking bugs resolved or explicit deferral decision:

## Governance and release
- [ ] Jira ↔ PR ↔ test/requirements traceability and current status updated
- [ ] Rules / ADR / docs / Confluence synced for new decisions
- [ ] User acceptance and merge authorization recorded
- [ ] No claim of auto-GO or production approval
- [ ] Deferred work captured in prioritized backlog

**Do not merge while required checks, UAT or authorization are missing.** See [project operating rules](../docs/qa/project-operating-rules.md).


## Risk-proportionate verification (QA-125)
- Change class: L1 minor / L2 functional / L3 critical (justify; escalate if uncertain):
- Applicable checks and justified NOT_APPLICABLE items:
- P0 UAT accepted **before** functional merge (RP-092); documentation-only review is not software UAT:
- Relevant milestone reconciliation and residual risks:

Follow [operational checklists](../docs/qa/operational-checklists.md). Required exact-HEAD CI, review and explicit owner merge authorization remain mandatory for every PR; no production authorization implied.
