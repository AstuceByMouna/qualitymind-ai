# QA-90 — OpenAI-assisted requirements analysis and human QA review

Status: Sprint 5 candidate — implementation under review.

## Roles and boundaries
- QA-96 deterministic rules remain free of external API calls.
- QA-90 is **manual and opt-in**: only active imported requirements with provenance.
- Two explicit user attestations are required for every OpenAI run: permission
  to send the requirement and its acceptance criteria to an external provider,
  and confirmation the user reviewed data sensitivity.
- Do not include business secrets, identifiers, client data or personal data in
  a QA sample. The built-in regex-based screening is only a conservative
  additional safeguard, **not** enterprise DLP. Real deployment must add
  tenant-aware authorization, classification, and data-processing approvals.
- The backend sends only title, description and acceptance-criteria text to
  OpenAI, not UUIDs, API keys, database credentials, or unrelated records.
- Explicit operation uses OpenAI Responses API, Structured Outputs validated by
  Pydantic; request includes store=false, bounded timeout, and retries disabled.
- Prompts treat requirement contents as untrusted data, never as instructions.

## Persistence and human governance
- Runs record model, prompt version, hashed source snapshot, provider status
  code category, timestamps and consent event. No keys or raw prompts.
- Suggestions include category, explanation, recommendation, possible test and
  suggested risk level. Nothing is automatically applied to source requirements.
- Human decision: accepted, edited with replacement text, or rejected.
- Reviews are tied to the exact requirement/run/suggestion and refuse changes
  once reviewed. They also reject results made stale by edits to the source.
- Failed provider calls produce a failed run without partial suggestions.
  Status 'processing' may require manual recovery after an unexpected process
  termination; a future worker/queue should handle durable job execution.

## Verification
- Unit tests for consent contracts, Structured Outputs and privacy screening.
- PostgreSQL integration tests on qualitymind_test use a fake OpenAI adapter.
  CI must never require an API key nor perform actual billable requests.
- UI tests should mock the OpenAI API proxy, testing both denied consent and
  human-review actions.
- A separate manual smoke test on synthetic requirements may use a real API
  key only with explicit consent and suitable budget.

## Explicit MVP limitations
No RBAC, multi-tenancy guarantees, strong DLP, auto-application, formal sign-off,
quota management, job queues, concurrency recovery, provider SLA or retention
enforcement. These are prerequisites for any production rollout.
