import { test, expect } from "@playwright/test";

/** QA-101 UAT regression: previously imported/source requirement seemed stale in Edit. */
test("QA-101 displays latest requirement data and acceptance criteria in Edit", async ({
  page, request,
}, testInfo) => {
  test.skip(testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires isolated QA frontend and database.");

  const api = "http://127.0.0.1:8001/api/v1/requirements";
  const unique = Math.random().toString(36).slice(2);
  const created = await request.post(api, {
    data: { title: "QA101 initial " + unique, description: "Original description " + unique },
  });
  expect(created.status()).toBe(201);
  const record = await created.json() as { id: string };
  const id = record.id;
  const criteriaApi = api + "/" + id + "/acceptance-criteria";
  const updatedTitle = "QA101 updated title " + unique;
  const updatedDescription = "Latest description " + unique;
  const criterion = "Given a registered user, when the user edits the requirement, then the latest acceptance criterion is visible " + unique;

  try {
    await page.goto("/requirements/" + id);
    await expect(page.getByRole("heading", { name: "Acceptance Criteria" })).toBeVisible();

    const added = await request.post(criteriaApi, { data: { content: criterion } });
    expect(added.status()).toBe(201);

    const changed = await request.patch(api + "/" + id, {
      data: { title: updatedTitle, description: updatedDescription },
    });
    expect(changed.status()).toBe(200);

    // Reproduce entering Edit immediately after an independently saved change.
    await page.getByTestId("requirement-edit-link").click();
    await expect(page).toHaveURL(new RegExp("/requirements/" + id + "/edit$"));
    await expect(page.getByTestId("requirement-edit-title")).toHaveValue(updatedTitle);
    await expect(page.getByTestId("requirement-edit-description")).toHaveValue(updatedDescription);
    await expect(page.getByRole("heading", { name: "Current acceptance criteria" })).toBeVisible();
    await expect(page.getByTestId("acceptance-criterion-content").filter({ hasText: criterion })).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("requirement-edit-title")).toHaveValue(updatedTitle);
    await expect(page.getByTestId("acceptance-criterion-content").filter({ hasText: criterion })).toBeVisible();

    // Read-only inspection must not overwrite independently saved data.
    const after = await request.get(api + "/" + id);
    expect(after.ok()).toBeTruthy();
    expect((await after.json()).title).toBe(updatedTitle);
    const criteria = await request.get(criteriaApi);
    expect(criteria.ok()).toBeTruthy();
    expect((await criteria.json()).items.some(
      (item: {content:string}) => item.content === criterion
    )).toBeTruthy();
  } finally {
    // QA artifacts are archived, not deleted from DEV or another environment.
    const archived = await request.post(api + "/" + id + "/archive");
    expect(archived.ok(), "Isolated QA artifact archival").toBeTruthy();
  }
});
