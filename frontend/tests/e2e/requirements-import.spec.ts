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
  await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading",{name:"Imported from UI"})).toBeVisible();
  const requirementId=page.url().split("/").pop();
  expect(requirementId).toMatch(/^[0-9a-f-]{36}$/);
  const result=await page.request.get((process.env.API_BASE_URL??"http://127.0.0.1:8001")+
    "/api/v1/requirements/"+requirementId);
  expect(result.ok()).toBeTruthy();
  const persisted=await result.json();
  expect(persisted.title).toBe("Imported from UI");
  expect(persisted.external_id).toBe(externalId);
});

test("QA-98 file picker supports long names and resets preview when replaced", async ({page}) => {
  await page.goto("/");
  const input = page.getByTestId("requirement-import-file");
  const name = "qualitymind-" + "requirements-long-filename-".repeat(6) + ".csv";
  await expect(page.getByText("Click to choose a CSV or XLSX file")).toBeVisible();
  await expect(page.getByTestId("requirement-import-preview")).toBeDisabled();
  await input.setInputFiles({name, mimeType:"text/csv", buffer:Buffer.from("external_id,title,description\nQA98-1,Example title,Example full description\n")});
  await expect(page.getByTestId("requirement-import-selected-file")).toHaveText("Selected file: " + name);
  await page.getByTestId("requirement-import-preview").click();
  await expect(page.getByTestId("requirement-import-row-description")).toHaveText("Example full description");
  await input.setInputFiles({name:"replacement.csv",mimeType:"text/csv",
    buffer:Buffer.from("external_id,title,description\nQA98-2,Replacement,Another description\n")});
  await expect(page.getByTestId("requirement-import-selected-file")).toContainText("replacement.csv");
  await expect(page.getByTestId("requirement-import-results")).toHaveCount(0);
  await expect(page.getByTestId("requirement-import-preview")).toBeEnabled();
});

test("QA-100 multiple imported requirements collapse the form and show verified navigation", async ({page}) => {
  const suffix=Math.random().toString(36).slice(2);
  await page.goto("/?page=2");
  const rows="external_id,title,description\n"+suffix+"-01,Imported alpha "+suffix+",Example A\n"+
    suffix+"-02,Imported beta "+suffix+",Example B\n";
  await page.getByTestId("requirement-import-file").setInputFiles({
    name:"QA100-batch-"+suffix+".csv",mimeType:"text/csv",buffer:Buffer.from(rows)
  });
  await page.getByTestId("requirement-import-preview").click();
  await expect(page.getByTestId("requirement-import-results")).toContainText("2 create");
  await page.getByTestId("requirement-import-confirm").click();
  await expect(page.getByTestId("requirement-import-completed")).toContainText("2 created");
  await expect(page.getByTestId("requirement-import-completed-link")).toHaveCount(2);
  await expect(page.getByTestId("requirement-import-file")).toHaveCount(0);
  await expect(page).toHaveURL("/");
  await page.getByTestId("requirement-import-another").click();
  await expect(page.getByTestId("requirement-import-file")).toHaveCount(1);
  await expect(page.getByTestId("requirement-import-preview")).toBeDisabled();
});
