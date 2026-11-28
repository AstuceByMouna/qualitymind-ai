# QA-79 — Browser accessibility and compatibility audit

[QA-79](https://gharbiconsulting.atlassian.net/browse/QA-79) · [Campaign plan](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/4259990)

## Observed evidence

Application source pinned to main `fda962e0b450e8b9f42dc5e5cf593c76213edd23`. Windows, Playwright 1.65.0, Chromium 158.0.8127.88, axe-core 4.14.0. Fresh Next.js on 13032 with an unreachable upstream and synthetic browser responses. Scan points: Requirements create and simulated 503, AI Test Design with draft, Automation Hub embedded in that draft, Risk-Based Testing after delayed loading, Failure Analysis empty, and Quality Governance with a synthetic release. The design and automation scans share the same page, so their repeated axe results are overlapping observations.

Chromium completed 3 viewport tests, exit 0, auditing 18 page-state/viewport combinations (390, 820 and 1440 px). There was no document-level horizontal overflow at those dimensions. The first 12 Tab presses per surface captured focus order and computed outline. Representative keyboard focus reached the title and description controls, test design picker, script path, risk selector, failure excerpt and objection form. Requirements error and risk loading were displayed in the controlled scenario. Application findings are recorded by the audit and do not turn a completed scan into a conformance pass.

Firefox: the installed revision 1532 failed all three attempts during browser context setup, reporting an unsupported `legacyInterceptor` in the Playwright protocol. WebKit: installed revision 2311 stalled before returning a usable result, and the mixed-engine run was interrupted. Matching managed Firefox/WebKit revisions for this Playwright build were absent. Compatibility verdict for both: BLOCKED. The standalone Chromium rerun produced the [sanitized observations](qa-79-observations.json).

## Findings

| ID / severity | Page and reproduction | Observed evidence | Expected |
| --- | --- | --- | --- |
| A11Y-01 / High (axe serious) | Open any audited surface and inspect the small breadcrumb in the header. | `.tracking-wider` foreground #90a1b9 on white, 2.63:1 across all viewport widths. | 4.5:1 for normal-size text. |
| A11Y-02 / Medium (axe serious) | At 820 or 1440 px inspect the Workspace label and the two Soon entries in the main sidebar. | #62748e on #020618, 4.23:1. Repeated across surfaces. | 4.5:1 for normal-size informative labels. |
| A11Y-03 / High (automated navigation observation) | At 390 px open an internal page such as /risk, then Tab through the available controls. | Primary navigation has no rendered client rect on all sampled surfaces. The layout does not present the desktop route set at this width. | A keyboard-accessible way to switch between available modules on mobile. |
| A11Y-04 / Medium (needs manual review) | Select the synthetic release at /governance and inspect the Release list container in the accessibility tree. | axe marks `div[aria-label="Release list"]` incomplete with prohibited-attribute guidance. | An appropriate semantic container whose name is exposed to assistive technology. Verify with a screen reader. |

Manual acceptance is NOT_RUN. Test screen-reader announcement behavior, visible focus and keyboard order across complete workflows, zoom/reflow and the remaining content and states. The samples do not establish WCAG conformance.

## Reproduce on an independent checkout

```powershell
git --no-optional-locks status --short --branch
git ls-remote origin refs/heads/main refs/heads/test/QA-79-accessibility-baseline
git clone --single-branch --branch test/QA-79-accessibility-baseline https://github.com/AstuceByMouna/qualitymind-ai.git ..\qualitymind-qa79
Set-Location ..\qualitymind-qa79\frontend
git rev-parse HEAD
$env:QM_A11Y_BROWSER = 'chromium'
node node_modules/playwright/cli.js test --config playwright.accessibility.config.ts
```

Use existing dependencies and a compatible browser. Optional browser overrides: `QM_A11Y_CHROMIUM_BIN`, `QM_A11Y_FIREFOX_BIN`, `QM_A11Y_WEBKIT_BIN`. axe is loaded from an existing installation or `QM_AXE_SCRIPT`. A missing axe installation is recorded with no scan data. Supply `QM_TEST_FONT_FIXTURE` to substitute external font requests in the local build, as used for this audit. Match the PR SHA. The config starts and stops its own loopback Next.js server. No database or FastAPI startup is required. Reporter output is local in `test-results/qa79-report.json`. The browser harness blocks network requests outside 13032. Use synthetic fixtures exclusively.
