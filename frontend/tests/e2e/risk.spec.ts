import { expect, test } from "@playwright/test";

const A = "00000000-0000-4000-8000-000000000121";
const B = "00000000-0000-4000-8000-000000000122";

test("QA-111 @smoke @mock-api risk assessment persists and drafts are not coverage", async ({ page }) => {
  let level: "UNKNOWN" | "HIGH" = "UNKNOWN";
  await page.route("**/api/risk/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === "/api/risk/requirements" && method === "GET") {
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          items: [
            { id: A, title: "Synthetic high requirement", risk_level: level, draft_count: 0, test_design_status: "NO_DRAFT", needs_test_design: level === "HIGH" },
            { id: B, title: "Synthetic draft requirement", risk_level: "UNKNOWN", draft_count: 1, test_design_status: "DRAFT_ONLY", needs_test_design: false },
          ],
          total: 2, limit: 200, offset: 0,
        }),
      });
    }
    if (path === "/api/risk/requirements/" + A + "/risk" && method === "PATCH") {
      const payload = route.request().postDataJSON() as { risk_level: "UNKNOWN" | "HIGH" };
      level = payload.risk_level;
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ id: A, title: "Synthetic high requirement", risk_level: level,
          draft_count: 0, test_design_status: "NO_DRAFT", needs_test_design: level === "HIGH" }),
      });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Unexpected route" }) });
  });

  await page.goto("/risk");
  await expect(page.getByTestId("risk-workbench")).toBeVisible();
  await expect(page.getByText("DRAFT_ONLY — review required, not approved or executed")).toBeVisible();
  await expect(page.getByLabel("Risk for Synthetic high requirement")).toHaveValue("UNKNOWN");
  await page.getByLabel("Risk for Synthetic high requirement").selectOption("HIGH");
  await expect(page.getByText("HIGH + NO_DRAFT")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Risk for Synthetic high requirement")).toHaveValue("HIGH");
  await page.getByTestId("risk-high-filter").check();
  await expect(page.getByTestId("risk-row")).toHaveCount(1);
});
