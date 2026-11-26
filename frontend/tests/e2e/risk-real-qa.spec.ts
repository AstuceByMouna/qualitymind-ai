import { expect, test } from "@playwright/test";

const fixtureId = process.env.QA84_FIXTURE_UUID;

test("QA-111 @smoke @real-qa assesses risk through browser/API/PostgreSQL and persists after reload", async ({ page }) => {
  test.skip(!fixtureId, "Requires ephemeral GitHub Actions QA84 fixture; never write DEV.");
  await page.goto("/risk");
  const source = page.locator('[data-testid="risk-row"]').filter({
    has: page.getByRole("link", { name: "QA84 CI isolated fixture", exact: true }),
  });
  await expect(source).toBeVisible();
  const risk = source.getByTestId("risk-level");
  await expect(risk).toHaveValue("UNKNOWN");
  await risk.selectOption("HIGH");
  await expect(source.getByText("HIGH + NO_DRAFT")).toBeVisible();
  await page.reload();
  const persisted = page.locator('[data-testid="risk-row"]').filter({
    has: page.getByRole("link", { name: "QA84 CI isolated fixture", exact: true }),
  });
  await expect(persisted.getByTestId("risk-level")).toHaveValue("HIGH");
  await expect(persisted.getByText("NO_DRAFT — no saved test case")).toBeVisible();
  // Leave the shared CI fixture unchanged before teardown.
  await persisted.getByTestId("risk-level").selectOption("UNKNOWN");
  await expect(persisted.getByTestId("risk-level")).toHaveValue("UNKNOWN");
});
