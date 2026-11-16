# QA-96 — Testability rules, FR-006

Version: `qa96-rules-v1`. This first pass is **deterministic**, not an LLM.
Explicit action POST `/api/v1/requirements/{id}/quality-analysis` reads the
requirement and acceptance criteria, returns versioned review hints and never
commits or mutates a source record.

Each finding has a stable rule identifier, category, observation, rationale,
optional evidence, suggestion and the label `deterministic-heuristic`.
Missing actor/trigger/outcome checks use heuristic vocabularies and may produce
false positives; flagged wording is a review cue, not a proven defect.
No finding is not proof of completeness. Missing acceptance criteria are a
suggestion, not a blocker. The source is always associated by UUID.
404 means a missing requirement; empty findings are valid.

A future OpenAI Structured Outputs analyzer will be kept separate. It will
not modify requirements or approve its own suggestions. Before transferring
potentially sensitive project requirements to an external provider, the
application must obtain explicit user authorization.
