import { expect, test } from "@playwright/test";

test("DC-01 @smoke governance navigation and initial state", async ({ page }) => {
  await page.route("**/api/governance/releases", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    } else {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000001", name: "Demo", version: "1.2", created_at: "2026-11-18T00:00:00Z" }) });
    }
  });
  await page.route("**/api/governance/requirements", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"items":[]}' }));
  await page.route("**/api/governance/releases/*/readiness", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"state":"UNDETERMINED","explanation":"Evidence missing.","obligations":[]}' }));
  await page.goto("/");
  await page.getByRole("link", { name: "Quality Governance" }).click();
  await expect(page).toHaveURL(/\/governance$/);
  await expect(page.getByTestId("governance-workbench")).toBeVisible();
  await page.getByTestId("release-name").fill("Demo");
  await page.getByTestId("release-version").fill("1.2");
  await page.getByTestId("create-release").click();
  await expect(page.getByTestId("release-readiness")).toContainText("UNDETERMINED");
  await expect(page.getByTestId("release-readiness")).not.toContainText("GO approved");
});
