# Jira backlog reconciliation — Sprints 7–10 (QA-125)

**Audit performed:** 2026-11-26 local / 2026-11-27 UTC. **Board:** QA board ID 3. This is a verified cross-reference, **not** a reconstructed Jira sprint burndown.

## Actual history

| Development sprint | Principal issue | PR(s) / merge evidence | Jira issue status after audit | Jira sprint record |
| --- | --- | --- | --- | --- |
| 7 — AI Test Design | QA-107 | [#51](https://github.com/AstuceByMouna/qualitymind-ai/pull/51) merged 2026-11-25 | Terminé | **Missing historically**, not retro-created |
| 8 — Risk-Based Testing | QA-111 | [#52](https://github.com/AstuceByMouna/qualitymind-ai/pull/52) and [#53](https://github.com/AstuceByMouna/qualitymind-ai/pull/53) merged 2026-11-26 | Terminé (corrected from Revue en cours) | **Missing historically**, not retro-created |
| 9 — Automation Hub | QA-112, QA-123 | [#54](https://github.com/AstuceByMouna/qualitymind-ai/pull/54) merged 2026-11-26 | Terminé | **Missing historically**, not retro-created |
| 10 — Failure Analysis | QA-124 | [#55](https://github.com/AstuceByMouna/qualitymind-ai/pull/55) Draft, NOT merged | En cours | Sprint 10, Jira ID 8, active |

Sprint 6 (Jira ID 7): after QA-102 and QA-103 were verified Terminé, closed 2026-11-27 UTC. Sprints 1–5 were already closed.

## Functional backlog: partial implementation is not full FR completion

| FR issues | Delivered subset (proof) | Undelivered / keep open |
| --- | --- | --- |
| QA-14, QA-15, QA-18, QA-19 | QA-107 deterministic positive/negative proposals with source criteria, DRAFT saving and basic fields, PR #51 | Advanced edit/approval, boundary-value test generation and broader test technique coverage |
| QA-27, QA-28, QA-29, QA-30 | QA-111 HIGH/MEDIUM/LOW/UNKNOWN risk on requirements, draft-gap highlighting, PR #52 | Verified executed/approved coverage, full risk policy and sophisticated prioritization |
| QA-31, QA-32 | QA-112 associates a *repository-relative Playwright path* to a DRAFT test case, persists across reload, PR #54 | Script lifecycle, orchestration, execution, real evidence and maintenance workflow |
| QA-37, QA-38, QA-39, QA-40 | QA-124 currently implements deterministic non-persistent clue classification on manually pasted *synthetic text*, PR #55 Draft | Persisted log ingestion, confirmed root cause, AI hypothesis review/override, links to run evidence. Not done while PR #55 unmerged |
| QA-44 | Some requirement→test→script metadata exists from PR #51/#54 | No full requirement→script→execution provenance and bidirectional traceability; intentionally OPEN |
| QA-108/109/110 | Vision accepted for generated living spec and component impact UI | Not implemented |
| QA-113 through QA-122 | QA Foundation Builder backlog/epic created | Not yet implemented; prioritize core source-grounded consulting MVP before audio/voice/change propagation |

## Other observed cleanup candidates — no automatic closure

- QA-25 first CI setup in **Revue en cours** despite later active CI; confirm original AC and historical proof.
- QA-69 broad QA automation program in **En cours**; scope may legitimately remain.
- QA-75 superseded local search story in **Revue en cours**; confirm whether to cancel/duplicate with QA-85.
- QA-80 CI Playwright industrialization in **En cours**; current checks exist, but do not equate with complete industrialization.
- QA-90 AI review in **Revue en cours**; PR #40 merged but confirm human consent/UAT and DoD before status change.

## Reconciliation policy

- Use **factual links** and a clear comment on the affected parent FR/epic. Do not mark an entire FR done because one narrower implementing US is done.
- No backdated Jira Sprint 7/8/9 creation. Retrospective report preserves the distinction between work executed and Scrum events recorded.
- Maintain open backlog of improvements and product milestones needed for first demonstrable MVP. Sprint 10 Jira ID 8 and QA-124/QA-125 are the live execution source.
- Each subsequent sprint starts with a real Jira sprint, issue allocation, DoR/P0/UAT, PR draft; ends with validated UAT/CI, merge approval, Jira status update and closure.
