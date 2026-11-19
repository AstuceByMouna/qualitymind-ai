import { test, expect } from "@playwright/test";

test("QA-97 archive and restore with explicit confirmation", async ({page,request}) => {
  const api = process.env.API_BASE_URL ?? "http://127.0.0.1:8001";
  const res = await request.post(api + "/api/v1/requirements", {
    data:{title:"QA-97 E2E archive",description:"No destructive deletion"}
  });
  expect(res.status()).toBe(201);
  const {id} = await res.json();
  await page.goto("/requirements/"+id);
  page.once("dialog",dialog=>dialog.dismiss());
  await page.getByTestId("requirement-archive-action").click();
  await expect(page.getByTestId("requirement-archive-action")).toHaveText("Archive requirement");
  page.once("dialog",dialog=>dialog.accept());
  await page.getByTestId("requirement-archive-action").click();
  await expect(page.getByTestId("requirement-archive-action")).toHaveText("Restore requirement");
  await page.reload();
  await expect(page.getByTestId("requirement-archive-action")).toHaveText("Restore requirement");
  const restored = page.waitForResponse(response =>
    response.url().includes("/api/requirements/"+id+"/restore") &&
    response.request().method() === "POST"
  );
  await page.getByTestId("requirement-archive-action").click();
  const restoreResponse = await restored;
  expect(restoreResponse.status()).toBe(200);
  const verified = await restoreResponse.json();
  expect(verified.id).toBe(id);
  expect(verified.archived_at).toBeNull();
  await expect(page.getByTestId("requirement-archive-action")).toHaveText("Archive requirement");
  const persisted = await request.get(api + "/api/v1/requirements/" + id);
  expect(persisted.status()).toBe(200);
  expect((await persisted.json()).archived_at).toBeNull();
  await page.reload();
  await expect(page.getByTestId("requirement-archive-action")).toHaveText("Archive requirement");
});
