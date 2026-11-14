
import { test, expect } from "@playwright/test";

test("QA-71 @smoke - affiche la page Requirements Workbench", async ({ page }) => {
  // 1. Ouvrir la page principale de QualityMind AI
  await page.goto("/");

  // 2. Vérifier que le titre principal apparaît
  await expect(
    page.getByRole("heading", {
      name: "Requirements Workbench",
      exact: true,
    })
  ).toBeVisible();

  // 3. Vérifier que le module Requirements Intelligence est présent
  await expect(
    page.getByRole("heading", {
      name: "Requirements Intelligence",
      exact: true,
    })
  ).toBeVisible();
});

