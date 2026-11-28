# QA-106 — Governance workflow UAT

## Candidate setup

From the owner's checkout, run `git --no-optional-locks status --short --branch`, `git stash list` and `git ls-remote origin refs/heads/main refs/heads/feature/QA-106-governance-ux`. Keep the checkout and stashes intact. Clone the candidate into a new sibling directory and compare its HEAD with the SHA in its PR.

```powershell
git clone --single-branch --branch feature/QA-106-governance-ux https://github.com/AstuceByMouna/qualitymind-ai.git ..\qualitymind-qa106
Set-Location ..\qualitymind-qa106
git rev-parse HEAD
git status --short --branch
```


## Isolated QA startup

Use a separate Windows host or VM with no existing QualityMind services on 5433, 8001 or 3001. Install the repository dependencies there and provision a fresh local `.env.qa` per the [QA environment guide](qa-environment.md). Use synthetic data only. Run at the clone root:

```powershell
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py db-up
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py migrate
```

In two separate terminals at the clone root, run the API and frontend commands. Run the check in a third terminal before creating fixtures. If another checkout has services on the QA ports, use the designated isolated host or VM.

```powershell
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py api
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py frontend
.\backend\.venv\Scripts\python.exe -B scripts/qa_env.py check
```

## Manual scenarios

Precondition: open `http://127.0.0.1:3001/governance` in that isolated QA environment. Create a synthetic requirement called Checkout confirmation. Use release Demo Checkout, version 1.0. Record the actual candidate SHA, browser, result and evidence for each row.

| Case | Steps and expected result | Owner status |
| --- | --- | --- |
| QA106-UAT-01 | Create and select Demo Checkout. Visit Release Readiness, Decision Challenger and History using Tab and Enter. The selected release and version remain visible. At 390 px, sections stack and controls remain reachable. | NOT_RUN |
| QA106-UAT-02 | Add a critical obligation for Checkout confirmation. Verify DC-01 shows UNDETERMINED and names the obligation. Record PASS evidence for 1.0. Confirm REVIEW_REQUIRED and the corresponding next action. | NOT_RUN |
| QA106-UAT-03 | Register a HIGH objection and a CRITICAL objection for the same obligation. Verify severity text and distinct badges. Record plausible harm, evidence and justification for the CRITICAL objection and qualify it. Confirm DC-01 remains REVIEW_REQUIRED while the combined decision shows NO_GO and identifies the active objection. | NOT_RUN |
| QA106-UAT-04 | Resolve the qualified objection with a reason, then reject the HIGH objection with a reason. Switch to History, select each objection, and verify actor, transition, reason and timestamp. Refresh and reselect the release to confirm the history was saved. | NOT_RUN |
| QA106-UAT-05 | Select a new empty synthetic release. Confirm there are no objections and History requests a selection or reports no entries. In a browser test profile, temporarily block the readiness request, select the release and verify the error. Unblock and reselect it to confirm recovery. | NOT_RUN |

## Corrective review scenarios

Use a browser test profile with request delays or substitution enabled locally and the isolated QA environment above. The automated companion uses synthetic stub responses. Restore normal request handling between cases.

| Case | Steps and expected result | Owner status |
| --- | --- | --- |
| QA106-UAT-06 — Release context | Select synthetic release Alpha 1.0 with one critical obligation and a visible DC-01 decision. Enter unsaved obligation and evidence values. Create Beta 2.0 while delaying its readiness response. When Beta is selected, confirm Alpha's decision, obligations, and objection controls are absent. Return a failure for Beta readiness. Confirm the error and absence of a decision. Restore the response, reselect Beta, and verify only Beta data is visible, with cleared dependent fields and tested version 2.0. | NOT_RUN |
| QA106-UAT-07 — Objection history | Under Alpha, create distinct synthetic Alpha and Beta objections. Reject the Alpha objection with a unique justification while delaying the response. Open History, select Beta, then release Alpha's response. Confirm the selection and events still belong to Beta. Reload, reselect the release, and confirm Alpha's rejection and justification are visible only in Alpha's history. Repeat by delaying an Alpha history read until Beta history is visible. | NOT_RUN |
| QA106-UAT-08 — Failed combined refresh | Resolve a qualified synthetic objection or reject an open one. Fail only the follow-up combined assessment request. Confirm the saved transition can be inspected in History, the old combined decision is absent, and mutation controls stay unavailable until Retry assessment succeeds. Restore the API and retry, then verify the current decision and objection status. | NOT_RUN |
