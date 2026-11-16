import { test, expect } from "@playwright/test";

test("QA-95 lifecycle persists across page refresh", async ({ page, request }) => {
  const backend = process.env.API_BASE_URL ?? "http://127.0.0.1:8001";
  const created = await request.post(backend + "/api/v1/requirements", {
    data: { title: "QA-95 lifecycle e2e", description: "state transition check" },
  });
  expect(created.status()).toBe(201);
  const requirement = await created.json();
  const id = requirement.id;
  await page.goto("/requirements/" + id);
  await expect(page.getByTestId("requirement-detail-status")).toHaveText("Draft");
  await page.getByTestId("transition-to-in-review").click();
  await expect(page.getByTestId("requirement-detail-status")).toHaveText("In Review");
  await page.reload();
  await expect(page.getByTestId("requirement-detail-status")).toHaveText("In Review");
  await page.getByTestId("transition-to-ready").click();
  await expect(page.getByTestId("requirement-detail-status")).toHaveText("Ready");
  await page.getByTestId("transition-to-draft").click();
  await expect(page.getByTestId("requirement-detail-status")).toHaveText("Draft");
  const forbidden = await request.post(backend + "/api/v1/requirements/" + id + "/transitions", {
    data: { status: "Ready" }
  });
  expect(forbidden.status()).toBe(409);
  await page.reload();
  await expect(page.getByTestId("requirement-detail-status")).toHaveText("Draft");
});
