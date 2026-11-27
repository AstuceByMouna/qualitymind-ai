# QualityMind AI — Working agreement for development agents

Owner-approved Lean AI Engineering Governance, 2026-11-26 Montreal; candidate on QA-125 / PR #56. Applies to the repository. Read this file and applicable nested instructions at resumption.

## 12 operating principles
1. MVP First — Enterprise by Design.
2. Continuity and accountability.
3. Lean project management.
4. Controlled software engineering.
5. Security, privacy and isolation.
6. Evidence integrity.
7. Risk-based quality engineering.
8. Responsible AI engineering.
9. Decision assurance.
10. Controlled release.
11. End-to-end traceability.
12. Living documentation.

The [binding rule register and full mapping](docs/qa/project-operating-rules.md) preserves RP-001–110. The [operational checklists](docs/qa/operational-checklists.md) define risk levels and event-based preflight. Read relevant detailed rules, [DoR/DoD](docs/qa/definition-of-done.md), [architecture](docs/architecture/system-architecture.md), ADR-001 and current sprint scope/UAT before affected work. Use verified live references; never infer actual state from summaries. Check full cross-system state at sprint start/end, functional merge and release; recheck mutable affected records before writes. If applicable supervisor instructions remain stricter, follow them until aligned.

## Non-negotiable
Protect local changes, use Jira-linked branch and Draft PR, no direct main development, no secrets or production/customer data in QA. Verify isolated QA DB before tests/migrations. No automated real OpenAI tests; manual live calls require explicit authorization. Report actual evidence only, distinguish user-reported and simulated results, verify exact candidate SHA. Required CI and review, documented accepted P0 UAT before functional merge, explicit owner merge approval; no automatic GO or production deployment. Escalate missing sources or conflicting rules affecting the operation.

Within an authorized mission, ordinary technical work, isolated tests, documentation/issue updates and Draft PR preparation need no repeated owner approval. Major architecture/product/rule changes, real paid AI tests, merge and deployment require explicit approval. Keep Jira ↔ PR ↔ requirements ↔ evidence synchronized at relevant milestones.

**Priority:** Safety and correctness > verified user decisions > MVP scope > polish. Preserve approved rules and historical decisions; record new decisions with date, reason, provenance and supersession. Communicate in French; new technical artifacts in English.


## Supervisor–Codex boundary (RP-111)
The Engineering Supervisor handles requirements, architecture/design, project governance, documentation and evidence review only. Codex performs software implementation, migrations, debugging and software tests. For technical work, the Supervisor prepares a complete Codex mission prompt; no automatic handoff is assumed. See [RP-111](docs/qa/project-operating-rules.md#8-supervisorcodex-responsibility-boundary-qa-125). This narrows the earlier delegation paragraph for the Supervisor, not Codex. All authorization, safety and evidence gates remain binding.
