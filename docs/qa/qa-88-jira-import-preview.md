# QA-88 — Synthetic Jira preview UAT

This increment maps synthetic fixtures independently of persisted CSV/XLSX imports. Post a JSON object containing up to 50 issues and 128 KiB in total. Each issue needs a Jira-style key and a fields object containing a bounded summary. Optional description, status.name and priority.name map to preview fields. Plain-text descriptions can supply an explicit Acceptance Criteria heading followed by a bullet or numbered list. Unsupported rich text and absent fields produce warnings. Source references are issue keys, independent of a live Jira site.

## Candidate setup

From the owner's checkout, run `git --no-optional-locks status --short --branch`, `git stash list` and `git ls-remote origin refs/heads/main refs/heads/feature/QA-88-jira-import-preview`. Keep the checkout and stashes intact. Clone the candidate into a new sibling directory and compare its HEAD with the SHA in its PR.

```powershell
git clone --single-branch --branch feature/QA-88-jira-import-preview https://github.com/AstuceByMouna/qualitymind-ai.git
Set-Location qualitymind-ai
git rev-parse HEAD
git status --short --branch
```


## Isolated QA startup

This preview needs one Next.js process. PostgreSQL and FastAPI startup are N/A for the preview. Point the frontend at an unused loopback port to prevent access to an existing backend. From a fresh clone with its frontend dependencies installed:

```powershell
Set-Location frontend
$env:API_BASE_URL='http://127.0.0.1:1'
$env:NEXT_TELEMETRY_DISABLED='1'
npm.cmd run dev -- --hostname 127.0.0.1 --port 13032
```

Open `http://127.0.0.1:13032/requirements/jira-preview`. Precondition: use synthetic Jira-shaped JSON exclusively. Record the exact candidate SHA, browser, actual result and evidence for each row.

| Case | Steps and expected result | Owner status |
| --- | --- | --- |
| QA88-UAT-01 | Insert the built-in sample and preview it. Confirm key DEMO-17, title, description, state To Do, priority Medium, one explicit criterion and JIRA_FIXTURE provenance. | NOT_RUN |
| QA88-UAT-02 | Replace the description with an object such as {"type":"doc"}, remove priority and leave status. Preview again. Confirm the two field warnings and the absence of an inferred criterion. | NOT_RUN |
| QA88-UAT-03 | Duplicate the sample issue within the array. Confirm both rows are visible and both report the duplicate key. | NOT_RUN |
| QA88-UAT-04 | Try {"issues":[]} for the empty state, malformed JSON for the syntax error, and a valid object with an invalid issue key for validation. Previous results should clear when input changes. | NOT_RUN |
| QA88-UAT-05 | Enable browser network throttling and preview the sample. Confirm a loading status and disabled submit button during processing. Inspect the network panel for the local preview request. Refresh and confirm the preview starts empty. | NOT_RUN |
