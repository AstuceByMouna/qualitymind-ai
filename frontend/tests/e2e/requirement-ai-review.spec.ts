import {test,expect} from "@playwright/test";

test("QA-90 requires affirmative consent before the AI request",async({page,request})=>{
 const api=process.env.API_BASE_URL??"http://127.0.0.1:8001";
 const created=await request.post(api+"/api/v1/requirements",{data:{
  title:"QA-90 synthetic record",description:"A user sees an error message for invalid input."
 }});
 expect(created.status()).toBe(201);
 const {id}=await created.json();
 await page.goto("/requirements/"+id);
 await expect(page.getByText("AI-assisted requirements review")).toBeVisible();
 await expect(page.getByTestId("ai-analyze")).toHaveCount(0);
 const data=await request.post(api+"/api/v1/requirements/"+id+"/ai-analysis",{data:{
  consent_to_external_processing:false,confirms_no_sensitive_data:false
 }});
 expect(data.status()).toBe(422);
});
