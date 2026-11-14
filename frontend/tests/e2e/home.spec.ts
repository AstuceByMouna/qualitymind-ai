
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

test("QA-82 - friendly failure message retains input", async ({ page }) => {
  await page.route("**/api/requirements", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "We couldn't confirm that your requirement was saved. Your information is still here. Check the requirements list before trying again.",
      }),
    });
  });

  await page.goto("/requirements/new");
  await page.getByTestId("requirement-title").fill("Unsaved after interruption");
  await page.getByTestId("requirement-description").fill("Keep these details in the form.");
  await page.getByTestId("requirement-create-submit").click();

  await expect(page.getByTestId("requirement-create-error")).toContainText("We couldn't confirm that your requirement was saved.");
  await expect(page.getByTestId("requirement-create-error")).not.toContainText(/FastAPI|PostgreSQL|API unavailable|server/i);
  await expect(page.getByTestId("requirement-title")).toHaveValue("Unsaved after interruption");
  await expect(page.getByTestId("requirement-description")).toHaveValue("Keep these details in the form.");
  await expect(page.getByTestId("requirement-create-submit")).toBeEnabled();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC01 - successful creation redirects to requirement details", async ({ page }) => {
  // Simulate the API response without creating data in PostgreSQL.
  // The real backend/persistence path was verified separately in manual TC01.
  const createdId = "7144d014-d7da-493e-b6b4-e64c1a0b7ec0";
  const payloads: unknown[] = [];

  await page.route("**/api/requirements", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    payloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: createdId }),
    });
  });

  await page.goto("/");
  await page.getByTestId("requirement-create-link").click();
  await expect(page).toHaveURL(/\/requirements\/new$/);

  await page.getByTestId("requirement-title").fill("  New requirement  ");
  await page.getByTestId("requirement-description").fill("  User-visible acceptance criterion.  ");
  await page.getByTestId("requirement-create-submit").click();

  await expect(page).toHaveURL(`http://127.0.0.1:3000/requirements/${createdId}`);
  expect(payloads).toEqual([{
    title: "New requirement",
    description: "User-visible acceptance criterion.",
  }]);
});
