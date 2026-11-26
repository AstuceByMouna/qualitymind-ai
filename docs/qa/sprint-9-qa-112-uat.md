# Sprint 9 — QA-112 — UAT evidence and sign-off (in progress)

PR: https://github.com/AstuceByMouna/qualitymind-ai/pull/54
Environment: local isolated QA, `qualitymind_qa`, API :8001, UI :3001.

## Results reported in conversation (2026-11-26)
| Case | Result | Evidence / limitation |
| --- | --- | --- |
| S9-UAT-01 | PASS (user-reported) | Script reference saved to a DRAFT case |
| S9-UAT-02 | PASS (user-reported) | Path remains after F5; screenshot displays persisted reference |
| S9-UAT-03 | PASS (user-reported) | Modified path `frontend/tests/e2e/checkout-updated.spec.ts` shown as saved |
| S9-UAT-04 | PASS (user-reported) | Invalid path rejected, validation error visible in screenshot |
| S9-UAT-05 | PARTIAL PASS | User answered 'pass' after re-running 404 and 409 HTTP scenarios. Treat 404 and 409 as user-reported PASS, but unchanged-reference GET after 409 and restored synthetic requirement were NOT separately confirmed. |
| S9-UAT-06 | PARTIAL PASS | User supplied actual output of `python scripts/qa_env.py check`: all three service checks PASS. Screenshot shows `NOT_EXECUTED`, persisted script reference. CI checks had been verified green on PR head `38ec829`; latest head must be rechecked before merge. |

## Observed anomaly
QA-123: selector displays 'Select requirement' while saved drafts and source link for a requirement remain visible. Screenshot provided. This is an unresolved UI consistency anomaly, not evidence of DB data loss; root cause unknown. Investigate and explicitly determine whether P0 or deferrable before merge.

## CI evidence
Seven checks succeeded on PR #54 head `38ec829146f451f22538a6fcc9cb6618bd756c8d` when inspected:
Next.js Lint/Build, FastAPI API Tests, QA-84 E2E, Python Unit Tests, FastAPI PostgreSQL, Postman API, QA-85 E2E.

## Exit gate
- Complete S9-UAT-05 integrity/readback and restore confirmation if not yet done.
- Triage QA-123, document risk/decision.
- Keep PR **DRAFT**, do not merge on partial acceptance.
- No production authorization.
