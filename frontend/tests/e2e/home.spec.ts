
import { test, expect } from "@playwright/test";

test("QA-71 - affiche la page Requirements Workbench", async ({ page }) => {
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

test("QA-82 - Cancel discards an unsaved draft", async ({ page }) => {
  await page.goto("/requirements/new");

  await page.getByTestId("requirement-title").fill("Unsaved draft");
  await page.getByTestId("requirement-description").fill("This content should be discarded.");
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");

  await page.getByTestId("requirement-create-link").click();
  await expect(page.getByTestId("requirement-title")).toBeEmpty();
  await expect(page.getByTestId("requirement-description")).toBeEmpty();
});

test("QA-82 - Back navigation discards an unsaved draft", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("requirement-create-link").click();
  await page.getByTestId("requirement-title").fill("Temporary value");
  await page.getByTestId("requirement-description").fill("Temporary details");
  await page.goBack();
  await page.getByTestId("requirement-create-link").click();

  await expect(page.getByTestId("requirement-title")).toBeEmpty();
  await expect(page.getByTestId("requirement-description")).toBeEmpty();
});
