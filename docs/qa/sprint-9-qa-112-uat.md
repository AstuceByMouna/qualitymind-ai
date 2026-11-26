# Sprint 9 — QA-112 — UAT evidence and sign-off (manual validation)

PR: https://github.com/AstuceByMouna/qualitymind-ai/pull/54
Environment: local isolated QA, `qualitymind_qa`, API :8001, UI :3001.

## Results reported in conversation (2026-11-26)
| Case | Result | Evidence / limitation |
| --- | --- | --- |
| S9-UAT-01 | PASS (user-reported) | Script reference saved to a DRAFT case |
| S9-UAT-02 | PASS (user-reported) | Path remains after F5; screenshot displays persisted reference |
| S9-UAT-03 | PASS (user-reported) | Modified path `frontend/tests/e2e/checkout-updated.spec.ts` shown as saved |
| S9-UAT-04 | PASS (user-reported) | Invalid path rejected, validation error visible in screenshot |
| S9-UAT-05 | PASS (user-reported after retest) | User reports HTTP 404 and 409 PASS; Swagger screenshot earlier showed 422 due to invalid request body, corrected on retest. User later reran persistence/readback check after concern about disappearance and confirmed PASS. User also answered PASS after restore instructions; no independent API logs provided for those steps. |
| S9-UAT-06 | PASS (user-reported, supported by logs/screenshot and historical CI) | User supplied output of `python scripts/qa_env.py check`: QA DB, API and frontend PASS. Screenshot shows `NOT_EXECUTED` and saved reference. Seven CI checks had passed on code head `38ec829`; recheck checks after documentation commits. |

## Observed anomaly
QA-123: selector displays 'Select requirement' while saved drafts and source link for a requirement remain visible. Screenshot provided. This is an unresolved UI consistency anomaly, not evidence of DB data loss; root cause unknown. Investigate and explicitly determine whether P0 or deferrable before merge.

## CI evidence
Seven checks succeeded on PR #54 head `38ec829146f451f22538a6fcc9cb6618bd756c8d` when inspected:
Next.js Lint/Build, FastAPI API Tests, QA-84 E2E, Python Unit Tests, FastAPI PostgreSQL, Postman API, QA-85 E2E.

## Exit gate
- Six manual cases reported PASS; evidence sources distinguished above. No remote independent replay of user's local environment.
- QA-123 remains unresolved (selector shows placeholder with case data displayed); investigate and make an explicit risk/deferral decision before merging.
- Recheck latest PR head CI after documentation updates.
- Keep PR **DRAFT** until QA-123 triage and latest CI results are recorded. No production authorization.
