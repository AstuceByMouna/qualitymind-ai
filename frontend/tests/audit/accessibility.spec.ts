import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

type AxeNode = { target: unknown; failureSummary?: string };
type AxeResult = { id: string; impact: string | null; nodes: AxeNode[] };

declare global {
  interface Window {
    axe: { run(context: HTMLElement, options: unknown): Promise<{ violations: AxeResult[]; incomplete: AxeResult[] }> };
  }
}

const requireLocal = createRequire(resolve("package.json"));
function optionalAxe() {
  const explicit = process.env.QM_AXE_SCRIPT;
  if (explicit) {
    if (!existsSync(explicit)) throw new Error("QM_AXE_SCRIPT does not exist");
    return explicit;
  }
  try {
    return requireLocal.resolve("axe-core/axe.min.js");
  } catch {
    return undefined;
  }
}

const REQ = "00000000-0000-4000-8000-000000000079";
const CASE = "00000000-0000-4000-8000-000000000080";
const RELEASE = "00000000-0000-4000-8000-000000000081";
const requirement = { id: REQ, title: "QA79 synthetic requirement", archived_at: null };
const draft = { id: CASE, requirement_id: REQ, criterion_id: null, title: "Synthetic draft",
  source_criterion: "Synthetic source", kind: "POSITIVE", expected_result: "Confirmation shown",
  requires_rule_clarification: false, status: "DRAFT" };

async function inspect(page: Page, name: string, axe: string | undefined) {
  const width = page.viewportSize()!.width;
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  const focus = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    focus.push(await page.evaluate(() => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement)) return null;
      const style = getComputedStyle(el);
      return { tag: el.tagName, id: el.id || el.getAttribute("data-testid"),
        label: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 80) || null,
        inMain: Boolean(el.closest("main")), outline: style.outlineStyle + " " + style.outlineWidth,
        shadow: style.boxShadow, focusVisible: el.matches(":focus-visible") };
    }));
  }
  const layout = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth,
    primaryNavigationVisible: Boolean(document.querySelector("nav[aria-label='Main navigation']")?.getClientRects().length),
  }));
  const scan = axe ? await page.evaluate(async () => {
    const result = await window.axe.run(document.body, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    function summarize(checks: AxeResult[]) {
      return checks.map(({ id, impact, nodes }) => ({
        id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
      }));
    }
    return { violations: summarize(result.violations), incomplete: summarize(result.incomplete) };
  }) : null;
  return { name, width, layout, focus, scan };
}

test("QA-79 keyboard, responsive and accessibility audit of six module surfaces", async ({ page, browserName, browser }, testInfo) => {
  let riskReady!: () => void;
  const riskGate = new Promise<void>((resolve) => { riskReady = resolve; });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:13032") return route.abort();
    const path = url.pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/requirements" && route.request().method() === "POST") {
      return route.fulfill({ status: 503, json: { error: "Synthetic service unavailable." } });
    }
    if (path === "/api/test-design/requirements") return route.fulfill({ json: { items: [requirement] } });
    if (path.endsWith("/test-cases/suggestions")) return route.fulfill({ json: [] });
    if (path.endsWith("/test-cases")) return route.fulfill({ json: [draft] });
    if (path.startsWith("/api/automation/test-cases/")) return route.fulfill({ json: {
      test_case_id: CASE, requirement_id: REQ, playwright_script_path: null, execution_status: "NOT_EXECUTED",
    } });
    if (path === "/api/risk/requirements") {
      await riskGate;
      return route.fulfill({ json: { items: [{ ...requirement, risk_level: "UNKNOWN",
        draft_count: 1, test_design_status: "DRAFT_ONLY", needs_test_design: false }], total: 1, limit: 200, offset: 0 } });
    }
    if (path === "/api/governance/releases") return route.fulfill({ json: [
      { id: RELEASE, name: "Synthetic release", version: "1.0", created_at: "2026-11-20T00:00:00Z" },
    ] });
    if (path === "/api/governance/requirements") return route.fulfill({ json: { items: [requirement] } });
    if (path.endsWith("/readiness")) return route.fulfill({ json: {
      state: "UNDETERMINED", explanation: "Evidence missing", obligations: [],
    } });
    if (path.endsWith("/assessment")) return route.fulfill({ json: {
      state: "UNDETERMINED", dc01_state: "UNDETERMINED", explanation: "Evidence missing",
      qualifying_critical_challenge_ids: [], challenges_total: 0, qualified_open: 0,
    } });
    if (path.endsWith("/challenges")) return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: {} });
  });

  const axe = optionalAxe();
  async function open(path: string) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    if (axe) await page.addScriptTag({ path: axe });
  }
  const audit = [];
  await open("/requirements/new");
  await page.getByLabel("Title").fill("Synthetic requirement");
  await page.getByLabel("Description").fill("Synthetic description.");
  await page.getByTestId("requirement-create-submit").click();
  await expect(page.getByTestId("requirement-create-error")).toBeVisible();
  audit.push(await inspect(page, "Requirements", axe));

  await open("/test-design");
  await page.getByTestId("test-design-requirement").selectOption(REQ);
  await expect(page.getByTestId("playwright-association")).toContainText("NOT_EXECUTED");
  audit.push(await inspect(page, "AI Test Design", axe));
  await expect(page.getByTestId("playwright-script-path")).toBeVisible();
  audit.push(await inspect(page, "Automation Hub in Test Design", axe));

  await open("/risk");
  try {
    await expect(page.getByText(/Loading risk/i)).toBeVisible();
  } finally {
    riskReady();
  }
  await expect(page.getByRole("combobox", { name: /Risk for QA79 synthetic requirement/ })).toBeVisible();
  audit.push(await inspect(page, "Risk-Based Testing", axe));

  await open("/failure-analysis");
  await expect(page.getByTestId("failure-analyze")).toBeDisabled();
  audit.push(await inspect(page, "Failure Analysis", axe));

  await open("/governance");
  await page.getByRole("button", { name: /Synthetic release/ }).click();
  await expect(page.getByTestId("release-readiness")).toContainText("UNDETERMINED");
  await expect(page.getByTestId("challenger-assessment")).toContainText("UNDETERMINED");
  audit.push(await inspect(page, "Quality Governance", axe));

  await testInfo.attach("qa79-observations", {
    contentType: "application/json",
    body: JSON.stringify({ browserName, version: browser.version(), simulatedApi: true, axe: Boolean(axe), audit }, null, 2),
  });
});
