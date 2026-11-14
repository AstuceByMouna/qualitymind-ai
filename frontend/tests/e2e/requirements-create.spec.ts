import { test, expect } from "@playwright/test";

test("QA82-TC03 @regression - Cancel discards an unsaved draft", async ({ page }) => {
  await page.goto("/requirements/new");

  await page.getByTestId("requirement-title").fill("Unsaved draft");
  await page.getByTestId("requirement-description").fill("This content should be discarded.");
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");

  await page.getByTestId("requirement-create-link").click();
  await expect(page.getByTestId("requirement-title")).toBeEmpty();
  await expect(page.getByTestId("requirement-description")).toBeEmpty();
});

test("QA82-TC04 @regression - Back navigation discards an unsaved draft", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("requirement-create-link").click();
  await page.getByTestId("requirement-title").fill("Temporary value");
  await page.getByTestId("requirement-description").fill("Temporary details");
  await page.goBack();
  await page.getByTestId("requirement-create-link").click();

  await expect(page.getByTestId("requirement-title")).toBeEmpty();
  await expect(page.getByTestId("requirement-description")).toBeEmpty();
});

test("QA82-TC06 @critical @mock-api - friendly failure message retains input", async ({ page }) => {
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

test("QA82-TC01 @critical @mock-api - successful creation redirects to requirement details", async ({ page }) => {
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


test("QA82-TC02 @critical - required fields show linked errors and focus Title", async ({ page }) => {
  await page.goto("/requirements/new");
  const title = page.getByTestId("requirement-title");
  const description = page.getByTestId("requirement-description");

  await page.getByTestId("requirement-create-submit").click();

  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(title).toHaveAttribute("aria-describedby", /requirement-title-error/);
  await expect(page.locator("#requirement-title-error")).toBeVisible();

  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-describedby", /requirement-description-error/);
  await expect(page.locator("#requirement-description-error")).toBeVisible();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC08 @critical - focus moves to Description when Title is valid", async ({ page }) => {
  await page.goto("/requirements/new");
  const title = page.getByTestId("requirement-title");
  const description = page.getByTestId("requirement-description");

  await title.fill("A valid requirement title");
  await page.getByTestId("requirement-create-submit").click();

  await expect(description).toBeFocused();
  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-describedby", /requirement-description-error/);
  await expect(page.locator("#requirement-description-error")).toBeVisible();
  await expect(title).toHaveAttribute("aria-invalid", "false");
});

test("QA82-TC05 @critical @mock-api - concurrent submit is blocked while saving", async ({ page }) => {
  const createdId = "182b9c07-a6e9-45a9-b24b-ae01151ce762";
  let postCount = 0;
  let finishRequest: () => void = () => {};
  const requestGate = new Promise<void>((resolve) => {
    finishRequest = resolve;
  });

  await page.route("**/api/requirements", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    postCount++;
    await requestGate;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: createdId }),
    });
  });

  await page.goto("/requirements/new");
  await page.getByTestId("requirement-title").fill("Prevent duplicate creation");
  await page.getByTestId("requirement-description").fill("Only one POST is allowed while a save is pending.");

  try {
    await page.getByTestId("requirement-create-submit").click();
    await expect(page.getByTestId("requirement-create-submit")).toBeDisabled();
    await expect(page.getByTestId("requirement-create-submit")).toHaveText("Saving…");
    await expect.poll(() => postCount).toBe(1);

    // Simulate a second submit event during the still-pending API request.
    // The synchronous submission lock must reject it.
    await page.getByTestId("requirement-create-form").dispatchEvent("submit", {
      bubbles: true,
      cancelable: true,
    });
    expect(postCount).toBe(1);
  } finally {
    finishRequest();
  }

  await expect(page).toHaveURL(`http://127.0.0.1:3000/requirements/${createdId}`);
  expect(postCount).toBe(1);
});
