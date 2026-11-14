
import { test, expect } from "@playwright/test";
import { RequirementsWorkbenchPage } from "../pages/requirements-workbench.page";

test("QA-71 @smoke - affiche la page Requirements Workbench", async ({ page }) => {
  const workbench = new RequirementsWorkbenchPage(page);
  await workbench.goto();
  await expect(workbench.heading).toBeVisible();
  await expect(workbench.intelligenceHeading).toBeVisible();
});

