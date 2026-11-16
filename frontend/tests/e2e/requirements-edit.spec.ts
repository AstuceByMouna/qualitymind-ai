import { test, expect } from "@playwright/test";
import { RequirementEditPage } from "../pages/requirement-edit.page";

// QA-84 tests share a dedicated fixture; avoid concurrent edits/restoration.
test.describe.configure({ mode: "serial" });

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


test("QA84-TC02 @qa-only - Cancel does not write and edit reloads original", async ({
  page, request,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires QA fixture and isolated QA frontend.");
  const api = `http://127.0.0.1:8001/api/v1/requirements/${id}`;
  const original = await (await request.get(api)).json() as { title: string; description: string };
  const edit = new RequirementEditPage(page);
  await edit.goto(id!);
  await edit.title.fill("Discard this changed title");
  await edit.description.fill("Discard this changed description");
  await edit.cancel.click();
  await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);
  const after = await (await request.get(api)).json() as typeof original;
  expect(after.title).toBe(original.title);
  expect(after.description).toBe(original.description);
  await edit.goto(id!);
  await expect(edit.title).toHaveValue(original.title);
  await expect(edit.description).toHaveValue(original.description);
});

test("QA84-TC03 @qa-only - invalid input focuses field and prevents PATCH", async ({
  page,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires QA fixture and isolated QA frontend.");
  const edit = new RequirementEditPage(page);
  let patches = 0;
  page.on("request", (request) => {
    if (request.method() === "PATCH") patches++;
  });
  await edit.goto(id!);
  await edit.title.fill("");
  await edit.submit.click();
  await expect(edit.title).toBeFocused();
  await expect(edit.title).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#edit-title-error")).toBeVisible();
  expect(patches).toBe(0);
});

test("QA84-TC04 @qa-only - non-existing requirement shows 404", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Only the isolated QA frontend is allowed.");
  await page.goto("/requirements/00000000-0000-4000-8000-000000000000/edit");
  await expect(page.getByRole("heading", { name: "This requirement is unavailable" })).toBeVisible();
});

test("QA84-TC05 @mock-api @qa-only - error preserves values and enables retry", async ({
  page,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires QA fixture and isolated QA frontend.");
  const edit = new RequirementEditPage(page);
  await page.route("**/api/requirements/**", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "We couldn't confirm that your changes were saved." }),
    });
  });
  await edit.goto(id!);
  await edit.title.fill("Not saved after network error");
  await edit.submit.click();
  await expect(edit.error).toContainText("couldn't confirm");
  await expect(edit.title).toHaveValue("Not saved after network error");
  await expect(edit.submit).toBeEnabled();
  await expect(page).toHaveURL((url) => url.pathname.endsWith(`/${id}/edit`));
});


test("QA84-TC06 @critical @mock-api @qa-only - concurrent edit submissions are blocked", async ({
  page,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires QA fixture and isolated QA frontend.");

  let patchCount = 0;
  let releasePatch: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releasePatch = resolve;
  });
  await page.route("**/api/requirements/**", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    patchCount++;
    await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id }),
    });
  });

  const edit = new RequirementEditPage(page);
  await edit.goto(id!);
  await edit.title.fill("Concurrent update test, no DB write");
  try {
    await edit.submit.click();
    await expect(edit.submit).toBeDisabled();
    await expect(page.getByText("Cancel", { exact: true })).toHaveAttribute("aria-disabled", "true");
    await expect.poll(() => patchCount).toBe(1);
    await edit.form.dispatchEvent("submit", { bubbles: true, cancelable: true });
    expect(patchCount).toBe(1);
  } finally {
    releasePatch();
  }
  await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);
  expect(patchCount).toBe(1);
});

test("QA91-TC01 @real-api @qa-only - three rapid consecutive edits persist correctly", async ({
  page, request,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || String(testInfo.project.use.baseURL ?? "") !== "http://127.0.0.1:3001",
    "Dedicated QA fixture and isolated QA frontend required");

  const api = `http://127.0.0.1:8001/api/v1/requirements/${id}`;
  const originalResponse = await request.get(api);
  expect(originalResponse.ok()).toBeTruthy();
  const original = await originalResponse.json() as {
    id: string; title: string; description: string; created_at: string;
  };
  const capturedErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|hydrated/i.test(message.text())) {
      capturedErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => capturedErrors.push(error.message));

  const first = `QA91-first-${Date.now()}`;
  const second = `QA91-second-${Date.now()}`;
  const third = `QA91-third-${Date.now()}`;
  const edit = new RequirementEditPage(page);
  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Requirements Workbench" })).toBeVisible();
    await edit.goto(id!);
    await edit.title.fill(first);
    await edit.submit.click();

    // As soon as the details screen appears, reopen Edit immediately.
    // Do not reload the page or delay between consecutive edits.
    await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);
    await page.getByTestId("requirement-edit-link").click();
    await expect(edit.title).toHaveValue(first);
    await edit.title.fill(second);
    await edit.submit.click();
    await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);
    await expect(page.getByRole("heading", { name: second, exact: true })).toBeVisible();

    // Regression reported by UAT: the THIRD immediate save got stuck "Saving...".
    await page.getByTestId("requirement-edit-link").click();
    await expect(edit.title).toHaveValue(second);
    await edit.title.fill(third);
    await edit.submit.click();
    await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);
    await expect(page.getByRole("heading", { name: third, exact: true })).toBeVisible();

    const response = await request.get(api);
    expect(response.ok()).toBeTruthy();
    const persisted = await response.json() as typeof original;
    expect(persisted.id).toBe(original.id);
    expect(persisted.created_at).toBe(original.created_at);
    expect(persisted.title).toBe(third);
    expect(persisted.description).toBe(original.description);
    expect(capturedErrors).toEqual([]);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Requirements Workbench" })).toBeVisible();
  } finally {
    const restore = await request.patch(api, {
      data: { title: original.title, description: original.description },
    });
    expect(restore.ok(), "QA fixture restoration must succeed").toBeTruthy();
  }
});


test("QA91-TC02 @qa-only - edit Back link returns to the same requirement", async ({
  page,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires isolated QA frontend and fixture.");

  const edit = new RequirementEditPage(page);
  await edit.goto(id!);
  const back = page.getByRole("link", { name: "Back to Requirement Details" });
  await expect(back).toHaveAttribute("href", `/requirements/${id}`);
  await back.click();
  await expect(page).toHaveURL((url) => url.pathname === `/requirements/${id}`);
  await expect(page.getByTestId("requirement-edit-link")).toBeVisible();
});

test("QA93-TC01 @real-api @qa-only - 255-character title stays readable in registry", async ({
  page, request,
}, testInfo) => {
  const id = process.env.QA84_FIXTURE_UUID;
  test.skip(!id || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires isolated QA fixture and frontend.");

  const api = `http://127.0.0.1:8001/api/v1/requirements/${id}`;
  const originalResponse = await request.get(api);
  expect(originalResponse.ok()).toBeTruthy();
  const original = await originalResponse.json() as {
    id: string; title: string; description: string;
  };
  const titles = [
    ("Alpha beta gamma delta epsilon ").repeat(10).slice(0, 255),
    "X".repeat(255),
  ];
  try {
    for (const title of titles) {
      expect(title.length).toBe(255);
      const patch = await request.patch(api, { data: { title } });
      expect(patch.status()).toBe(200);
      await page.goto(`/?q=${encodeURIComponent(title.slice(0, 24))}`);
      const link = page.getByRole("link", { name: title, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("title", title);
      const span = link.getByTestId("requirement-registry-title");
      await expect(span).toHaveCSS("-webkit-line-clamp", "2");
      await expect(span).toHaveCSS("overflow-wrap", "anywhere");

      const bounds = await span.boundingBox();
      const lineHeight = await span.evaluate((node) =>
        parseFloat(window.getComputedStyle(node).lineHeight));
      expect(bounds).not.toBeNull();
      expect(lineHeight).toBeGreaterThan(0);
      expect(bounds!.height).toBeLessThanOrEqual(lineHeight * 2 + 3);
      await link.click();
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`/?q=${encodeURIComponent(title.slice(0, 24))}`);
      const mobileTitle = page.getByRole("link", { name: title, exact: true });
      await expect(mobileTitle).toBeVisible();
      await expect(page.locator("table")).toHaveCSS("table-layout", "fixed");
      const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth + 2);
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  } finally {
    const restored = await request.patch(api, {
      data: { title: original.title, description: original.description },
    });
    expect(restored.ok(), "Restore the QA-only fixture").toBeTruthy();
  }
});
