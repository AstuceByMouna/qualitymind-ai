import { expect, test } from "@playwright/test";

const REQ = "00000000-0000-4000-8000-000000000181";
const CRITERION = "00000000-0000-4000-8000-000000000182";
const CASE = "00000000-0000-4000-8000-000000000183";
const draft = {
  id: CASE, requirement_id: REQ, criterion_id: CRITERION,
  title: "Synthetic checkout test", source_criterion: "Valid checkout",
  kind: "POSITIVE", preconditions: "A customer exists",
  steps: "Complete the checkout", expected_result: "Confirmation shown",
  requires_rule_clarification: false, status: "DRAFT",
  generator_version: "rules-v1", created_at: "2026-11-25T00:00:00Z",
};
let path: string | null;

test.beforeEach(() => { path = null; });

test("QA-112 @smoke @mock-api links Playwright script without claiming execution", async ({ page }) => {
  const caseBase = `/api/test-design/requirements/${REQ}/test-cases`;
  await page.route("**/api/test-design/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const result = pathname === "/api/test-design/requirements"
      ? { items: [{ id: REQ, title: "QA112 fixture", archived_at: null }] }
      : pathname === caseBase + "/suggestions" ? [] : pathname === caseBase ? [draft] : [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(result) });
  });
  await page.route("**/api/automation/test-cases/**", async (route) => {
    const req = route.request();
    let status = 200;
    if (req.method() === "PATCH") {
      const body = req.postDataJSON() as { playwright_script_path: string };
      if (body.playwright_script_path.includes("..")) status = 422;
      else path = body.playwright_script_path;
    }
    await route.fulfill({
      status, contentType: "application/json",
      body: JSON.stringify(status === 422 ? { detail: "Invalid path" } :
        { test_case_id: CASE, requirement_id: REQ, playwright_script_path: path, execution_status: "NOT_EXECUTED" }),
    });
  });

  await page.goto("/test-design");
  await page.getByTestId("test-design-requirement").selectOption(REQ);
  const widget = page.getByTestId("playwright-association");
  await expect(widget).toBeVisible();
  await expect(widget).toContainText("NOT_EXECUTED");
  await widget.getByTestId("playwright-script-path").fill("frontend/tests/e2e/checkout.spec.ts");
  await widget.getByTestId("playwright-save").click();
  await expect(widget.getByTestId("playwright-persisted")).toContainText("checkout.spec.ts");
  await page.reload();
  await page.getByTestId("test-design-requirement").selectOption(REQ);
  await expect(page.getByTestId("playwright-script-path")).toHaveValue("frontend/tests/e2e/checkout.spec.ts");
  await expect(page.getByTestId("playwright-association")).toContainText("NOT_EXECUTED");

  await page.getByTestId("playwright-script-path").fill("../secret.spec.ts");
  await page.getByTestId("playwright-save").click();
  await expect(page.getByTestId("playwright-association").getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("playwright-persisted")).toContainText("checkout.spec.ts");
});
