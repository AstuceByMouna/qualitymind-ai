import { expect, test } from "@playwright/test";

test("QA-88 preview uses only the bounded local endpoint", async ({ request }) => {
  const url = "/api/imports/jira-preview";
  expect((await request.post(url, { data: Buffer.from("{"), headers: { "Content-Type": "application/json" } })).status()).toBe(400);
  expect((await request.post(url, { data: Buffer.alloc(131073, "x"), headers: { "Content-Type": "application/json" } })).status()).toBe(413);
  expect((await request.post(url, { data: { issues: [{ key: "invalid" }] } })).status()).toBe(422);
  expect((await request.get(url)).status()).toBe(405);
  const response = await request.post(url, { data: { issues: [
    { key: "DEMO-1", fields: { summary: "First" } },
    { key: "DEMO-1", fields: { summary: "Duplicate" } },
  ] } });
  expect(response.status()).toBe(200);
  expect((await response.json()).issues.map((issue: { duplicate: boolean }) => issue.duplicate)).toEqual([true, true]);
});

test("QA-88 @mock-api exposes loading, warnings, empty and error", async ({ page }) => {
  let mode: "ok" | "empty" | "error" = "ok";
  let releaseResponse!: () => void;
  const pending = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route("**/api/imports/jira-preview", async (route) => {
    expect(route.request().method()).toBe("POST");
    await pending;
    if (mode === "error") {
      await route.fulfill({ status: 422, json: { error: "Invalid fixture." } });
      return;
    }
    await route.fulfill({ json: { issues: mode === "empty" ? [] : [{
      sourceReference: "Jira issue DEMO-17", source: "JIRA_FIXTURE", key: "DEMO-17",
      title: "Synthetic confirmation", description: null, status: "To Do", priority: null,
      acceptanceCriteria: ["Shows confirmation"], warnings: ["Priority is missing."],
    }] } });
  });
  await page.goto("/requirements/jira-preview");
  await page.getByRole("button", { name: "Insert sample" }).click();
  const preview = page.getByRole("button", { name: "Preview requirements" });
  await preview.click();
  try {
    await expect(page.getByRole("status")).toContainText("Preparing preview");
  } finally {
    releaseResponse();
  }
  await expect(page.getByText("Jira issue DEMO-17 · JIRA_FIXTURE")).toBeVisible();
  await expect(page.getByText("Shows confirmation")).toBeVisible();
  await expect(page.getByRole("list", { name: "Mapping warnings" })).toContainText("Priority is missing.");
  mode = "empty";
  await preview.click();
  await expect(page.getByRole("status")).toContainText("No issues");
  mode = "error";
  await preview.click();
  await expect(page.getByRole("alert").filter({ hasText: "Invalid fixture" })).toBeVisible();
  await expect(page.getByText("Shows confirmation")).toHaveCount(0);
});
