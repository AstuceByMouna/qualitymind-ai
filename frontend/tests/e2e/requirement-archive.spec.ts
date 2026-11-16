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
  await page.getByTestId("requirement-archive-action").click();
  await expect(page.getByTestId("requirement-archive-action")).toHaveText("Archive requirement");
});
