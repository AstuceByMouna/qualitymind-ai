import { test, expect } from "@playwright/test";

test("QA-87 CSV preview and confirm", async ({page}) => {
  const externalId = "QA87-UI-" + Math.random().toString(36).slice(2);
  await page.goto("/");
  const file=page.getByTestId("requirement-import-file");
  await file.setInputFiles({
    name: "qa87-import-ui.csv", mimeType: "text/csv",
    buffer: Buffer.from("external_id,title,description,priority,acceptance_criteria\n"+externalId+",Imported from UI,Example criterion,High,Given input when action then receipt\n")
  });
  await expect(page.getByTestId("requirement-import-selected-file")).toContainText("qa87-import-ui.csv");
  await page.getByTestId("requirement-import-preview").click();
  await expect(page.getByTestId("requirement-import-row-description")).toHaveText("Example criterion");
  await expect(page.getByTestId("requirement-import-row-criteria")).toHaveText("Given input when action then receipt");
  await expect(page.getByTestId("requirement-import-results")).toContainText("1 create");
  await page.getByTestId("requirement-import-confirm").click();
  await expect(page.getByTestId("requirement-import-confirm")).toHaveText("Imported");
  await expect(page.getByTestId("requirement-import-open-requirement")).toHaveAttribute("href", /\/requirements\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("requirement-registry-title").filter({hasText:"Imported from UI"})).toBeVisible();
});

test("QA-98 file picker supports long names and resets preview when replaced", async ({page}) => {
  await page.goto("/");
  const input = page.getByTestId("requirement-import-file");
  const name = "qualitymind-" + "requirements-long-filename-".repeat(6) + ".csv";
  await expect(page.getByText("Click to choose a CSV or XLSX file")).toBeVisible();
  await expect(page.getByTestId("requirement-import-preview")).toBeDisabled();
  await input.setInputFiles({name, mimeType:"text/csv", buffer:Buffer.from("external_id,title,description\\nQA98-1,Example title,Example full description\\n")});
  await expect(page.getByTestId("requirement-import-selected-file")).toHaveText("Selected file: " + name);
  await page.getByTestId("requirement-import-preview").click();
  await expect(page.getByTestId("requirement-import-row-description")).toHaveText("Example full description");
  await input.setInputFiles({name:"replacement.csv",mimeType:"text/csv",
    buffer:Buffer.from("external_id,title,description\\nQA98-2,Replacement,Another description\\n")});
  await expect(page.getByTestId("requirement-import-selected-file")).toContainText("replacement.csv");
  await expect(page.getByTestId("requirement-import-results")).toHaveCount(0);
  await expect(page.getByTestId("requirement-import-preview")).toBeEnabled();
});
