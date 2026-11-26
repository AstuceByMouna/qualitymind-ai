import { expect, test } from "@playwright/test";

test("QA-111 @smoke @real-qa assesses risk through browser/API/PostgreSQL and persists after reload", async ({ page }) => {
  test.skip(!process.env.QA84_FIXTURE_UUID, "Requires isolated GitHub Actions QA84 DB; never touch DEV.");

  // Do not reuse the shared QA-84 fixture: concurrent suites may edit/archive it.
  // Create a private disposable QA requirement for each retry, to avoid leaked HIGH state.
  const title = "QA111 isolated risk " + Math.random().toString(36).slice(2);
  const api = "http://127.0.0.1:8001/api/v1/requirements";
  const created = await page.request.post(api, {
    data: { title, description: "Disposable QA-111 browser/database regression fixture" },
  });
  expect(created.status()).toBe(201);
  const item: { id: string } = await created.json();
  const row = () => page.locator('[data-testid="risk-row"]').filter({
    has: page.getByRole("link", { name: title, exact: true }),
  });

  try {
    await page.goto("/risk");
    await expect(row()).toBeVisible();
    const risk = row().getByTestId("risk-level");
    await expect(risk).toHaveValue("UNKNOWN");
    await risk.selectOption("HIGH");
    await expect(row().getByText("HIGH + NO_DRAFT")).toBeVisible();
    await page.reload();
    await expect(row().getByTestId("risk-level")).toHaveValue("HIGH");
    await expect(row().getByText("NO_DRAFT — no saved test case")).toBeVisible();
  } finally {
    // Archive only the fixture this test created; QA DB is disposable in CI.
    const archived = await page.request.post(api + "/" + item.id + "/archive");
    expect(archived.status()).toBe(200);
  }
});
