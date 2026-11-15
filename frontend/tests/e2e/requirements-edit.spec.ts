import { test, expect } from "@playwright/test";
import { RequirementEditPage } from "../pages/requirement-edit.page";

// This spec is intentionally QA-only: it must never edit the developer DB.
// A dedicated existing QA requirement UUID is provided to the test runner.
// The test restores the original values even if an assertion fails.
test("QA84-TC01 @real-api @qa-only - edit persists, then restore fixture", async ({
  page, request,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  const base = String(testInfo.project.use.baseURL ?? "");
  test.skip(!id || base !== "http://127.0.0.1:3001",
    "Requires isolated QA frontend (3001) and QA84_FIXTURE_UUID.");

  const apiUrl = `http://127.0.0.1:8001/api/v1/requirements/${id}`;
  const before = await request.get(apiUrl);
  expect(before.ok(), "The QA fixture must already exist").toBeTruthy();
  const original = (await before.json()) as {
    id: string; title: string; description: string; created_at: string;
  };
  expect(original.id).toBe(id);

  const edit = new RequirementEditPage(page);
  const newTitle = `QA84 edit verified ${Date.now()}`;
  try {
    await edit.goto(id!);
    await expect(edit.title).toHaveValue(original.title);
    await expect(edit.description).toHaveValue(original.description);
    await edit.title.fill(newTitle);
    await edit.submit.click();
    await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);

    const after = await request.get(apiUrl);
    expect(after.ok()).toBeTruthy();
    const updated = await after.json() as typeof original;
    expect(updated.id).toBe(original.id);
    expect(updated.created_at).toBe(original.created_at);
    expect(updated.title).toBe(newTitle);
    expect(updated.description).toBe(original.description);
  } finally {
    const restore = await request.patch(apiUrl, {
      data: { title: original.title, description: original.description },
    });
    expect(restore.ok(), "QA fixture restoration must succeed").toBeTruthy();
  }
});
