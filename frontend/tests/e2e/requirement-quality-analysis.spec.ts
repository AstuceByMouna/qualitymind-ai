import {test,expect} from "@playwright/test";
test("QA-96 rules identify ambiguous wording without changing source", async ({page,request})=>{
  const api=process.env.API_BASE_URL??"http://127.0.0.1:8001";
  const created=await request.post(api+"/api/v1/requirements",{data:{title:"QA96 vague rapide",description:"Le client doit avoir un système rapide"}});
  expect(created.status()).toBe(201);
  const original=await created.json();
  await page.goto("/requirements/"+original.id);
  await page.getByTestId("analyze-requirement").click();
  await expect(page.getByTestId("quality-analysis-results")).toContainText("Potentially untestable wording");
  const after=await request.get(api+"/api/v1/requirements/"+original.id);
  expect(after.status()).toBe(200);
  expect((await after.json()).title).toBe(original.title);
});
