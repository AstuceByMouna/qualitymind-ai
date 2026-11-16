import { test, expect } from "@playwright/test";

test("QA-87 CSV preview and confirm", async ({page}) => {
  await page.goto("/");
  const file=page.getByTestId("requirement-import-file");
  await file.setInputFiles({
    name: "qa87-import-ui.csv", mimeType: "text/csv",
    buffer: Buffer.from("external_id,title,description\nQA87-UI-1,Imported from UI,Example criterion\n")
  });
  await page.getByTestId("requirement-import-preview").click();
  await expect(page.getByTestId("requirement-import-results")).toContainText("1 create");
  await page.getByTestId("requirement-import-confirm").click();
  await expect(page.getByTestId("requirement-import-confirm")).toHaveText("Imported");
  await expect(page.getByText("Imported from UI")).toBeVisible();
});
