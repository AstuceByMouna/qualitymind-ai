import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("QA94-TC01 @real-api @qa-only - add, edit, cancel and delete isolated criteria", async ({
  page, request,
}, testInfo) => {
  const requirementId = process.env.QA84_FIXTURE_UUID;
  test.skip(!requirementId || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Needs dedicated QA requirement and isolated frontend.");
  const api = "http://127.0.0.1:8001/api/v1/requirements/" + requirementId + "/acceptance-criteria";
  const before = await request.get(api);
  expect(before.ok()).toBeTruthy();
  const original = (await before.json()) as {
    items: { id: string; content: string; position: number }[];
  };
  const knownIds = new Set(original.items.map((item) => item.id));
  const marker = Date.now().toString(36) + "-retry" + testInfo.retry;
  const titleA = "Given registered customer " + marker + ", when logging in, then access succeeds";
  const titleB = "Given invalid credentials " + marker + ", when submitting, then an error is shown";
  try {
    await page.goto("/requirements/" + requirementId);
    await expect(page.getByRole("heading", { name: "Acceptance Criteria" })).toBeVisible();
    const input = page.getByTestId("acceptance-criterion-new-input");
    const add = page.getByTestId("acceptance-criterion-add");
    await input.fill("    ");
    await add.click();
    await expect(page.getByTestId("acceptance-criteria-error")).toContainText("1 and 2,000");

    await input.fill("  " + titleA + "  ");
    await add.click();
    await expect(page.getByTestId("acceptance-criterion-content").filter({ hasText: titleA })).toBeVisible();
    await input.fill(titleB);
    await add.click();
    await expect(page.getByTestId("acceptance-criterion-row")).toHaveCount(original.items.length + 2);

    const first = page.getByTestId("acceptance-criterion-row").filter({ hasText: titleA });
    await first.getByRole("button", { name: /Edit criterion/ }).click();
    await page.getByTestId("acceptance-criterion-edit-input").fill("Draft to cancel");
    // Editing replaces the rendered text with a textarea: the hasText-based
    // row locator intentionally no longer matches until Cancel restores it.
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(first).toContainText(titleA);

    await first.getByRole("button", { name: /Edit criterion/ }).click();
    await page.getByTestId("acceptance-criterion-edit-input").fill("Changed acceptance criterion");
    await page.getByTestId("acceptance-criterion-save").click();
    await expect(page.getByTestId("acceptance-criterion-row").filter({
      hasText: "Changed acceptance criterion",
    })).toBeVisible();

    // First confirm: Cancel must never write to the backend.
    page.once("dialog", async (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: /Delete criterion/ }).last().click();
    await expect(page.getByTestId("acceptance-criterion-row")).toHaveCount(original.items.length + 2);
    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Delete criterion/ }).last().click();
    await expect(page.getByTestId("acceptance-criterion-row")).toHaveCount(original.items.length + 1);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Acceptance Criteria" })).toBeVisible();
    await expect(page.getByTestId("acceptance-criterion-row").filter({
      hasText: "Changed acceptance criterion",
    })).toBeVisible();
    await expect(page.getByTestId("acceptance-criterion-row")).toHaveCount(original.items.length + 1);

    const after = await request.get(api);
    expect(after.ok()).toBeTruthy();
    const criteria = (await after.json()) as typeof original;
    expect(criteria.items.find((criterion) => criterion.content === "Changed acceptance criterion")).toBeTruthy();
    expect(criteria.items.map((criterion) => criterion.position)).toEqual(
      Array.from({ length: criteria.items.length }, (_, idx) => idx + 1),
    );
  } finally {
    // Remove only criteria introduced by this QA test, including on assertion failure.
    const response = await request.get(api);
    if (response.ok()) {
      const data = (await response.json()) as typeof original;
      for (const item of data.items) {
        if (!knownIds.has(item.id)) {
          const removed = await request.delete(api + "/" + item.id);
          expect(removed.status(), "QA94 fixture cleanup").toBe(204);
        }
      }
    }
  }
});
