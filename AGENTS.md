# QualityMind AI — Working agreement for development agents

This file applies to the entire repository. Before changing code, Jira or a sprint, read:
1. [Binding project operating rules](docs/qa/project-operating-rules.md).
2. [Definition of Ready / Done](docs/qa/definition-of-done.md).
3. [Canonical architecture](docs/architecture/system-architecture.md) and ADR-001.
4. The current sprint UAT and scope. Check the actual state of Jira, GitHub and CI; do not infer it from summaries.

**Priority:** Safety and correctness > verified user decisions > MVP scope > polish. New explicit decisions must be appended to versioned rules/ADR/ticket with date, reason, and superseded rule if any. Never silently discard a previously adopted rule.

Keep Jira ↔ branch/PR ↔ tests ↔ UAT ↔ release decision synchronized for each change. Never report PASS without actual results or a clearly labelled user declaration, never merge before the applicable UAT/CI sign-off, and never equate merge with production approval. No production or sensitive customer data in QA environments.
