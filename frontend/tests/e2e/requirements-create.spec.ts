import { test, expect } from "@playwright/test";
import { RequirementsWorkbenchPage } from "../pages/requirements-workbench.page";
import { RequirementCreatePage } from "../pages/requirement-create.page";

test("QA82-TC03 @regression - Cancel discards an unsaved draft", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
  await create.goto();

  await create.titleInput.fill("Unsaved draft");
  await create.descriptionInput.fill("This content should be discarded.");
  await create.cancel();
  await expect(page).toHaveURL(/\/$/);

  await workbench.openCreateRequirement();
  await expect(create.titleInput).toBeEmpty();
  await expect(create.descriptionInput).toBeEmpty();
});

test("QA82-TC04 @regression - Back navigation discards an unsaved draft", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
  await workbench.goto();
  await workbench.openCreateRequirement();
  await create.titleInput.fill("Temporary value");
  await create.descriptionInput.fill("Temporary details");
  await page.goBack();
  await workbench.openCreateRequirement();

  await expect(create.titleInput).toBeEmpty();
  await expect(create.descriptionInput).toBeEmpty();
});

test("QA82-TC06 @critical @mock-api - friendly failure message retains input", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await page.route("**/api/requirements", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "We couldn't confirm that your requirement was saved. Your information is still here. Check the requirements list before trying again.",
      }),
    });
  });

  await create.goto();
  await create.titleInput.fill("Unsaved after interruption");
  await create.descriptionInput.fill("Keep these details in the form.");
  await create.submit();

  await expect(create.formError).toContainText("We couldn't confirm that your requirement was saved.");
  await expect(create.formError).not.toContainText(/FastAPI|PostgreSQL|API unavailable|server/i);
  await expect(create.titleInput).toHaveValue("Unsaved after interruption");
  await expect(create.descriptionInput).toHaveValue("Keep these details in the form.");
  await expect(create.submitButton).toBeEnabled();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC01 @critical @mock-api - successful creation redirects to requirement details", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
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

  await workbench.goto();
  await workbench.openCreateRequirement();
  await expect(page).toHaveURL(/\/requirements\/new$/);

  await create.titleInput.fill("  New requirement  ");
  await create.descriptionInput.fill("  User-visible acceptance criterion.  ");
  await create.submit();

  await expect(page).toHaveURL(new RegExp(`/requirements/${createdId}import { test, expect } from "@playwright/test";
import { RequirementsWorkbenchPage } from "../pages/requirements-workbench.page";
import { RequirementCreatePage } from "../pages/requirement-create.page";

test("QA82-TC03 @regression - Cancel discards an unsaved draft", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
  await create.goto();

  await create.titleInput.fill("Unsaved draft");
  await create.descriptionInput.fill("This content should be discarded.");
  await create.cancel();
  await expect(page).toHaveURL(/\/$/);

  await workbench.openCreateRequirement();
  await expect(create.titleInput).toBeEmpty();
  await expect(create.descriptionInput).toBeEmpty();
});

test("QA82-TC04 @regression - Back navigation discards an unsaved draft", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
  await workbench.goto();
  await workbench.openCreateRequirement();
  await create.titleInput.fill("Temporary value");
  await create.descriptionInput.fill("Temporary details");
  await page.goBack();
  await workbench.openCreateRequirement();

  await expect(create.titleInput).toBeEmpty();
  await expect(create.descriptionInput).toBeEmpty();
});

test("QA82-TC06 @critical @mock-api - friendly failure message retains input", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await page.route("**/api/requirements", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "We couldn't confirm that your requirement was saved. Your information is still here. Check the requirements list before trying again.",
      }),
    });
  });

  await create.goto();
  await create.titleInput.fill("Unsaved after interruption");
  await create.descriptionInput.fill("Keep these details in the form.");
  await create.submit();

  await expect(create.formError).toContainText("We couldn't confirm that your requirement was saved.");
  await expect(create.formError).not.toContainText(/FastAPI|PostgreSQL|API unavailable|server/i);
  await expect(create.titleInput).toHaveValue("Unsaved after interruption");
  await expect(create.descriptionInput).toHaveValue("Keep these details in the form.");
  await expect(create.submitButton).toBeEnabled();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC01 @critical @mock-api - successful creation redirects to requirement details", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
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

  await workbench.goto();
  await workbench.openCreateRequirement();
  await expect(page).toHaveURL(/\/requirements\/new$/);

  await create.titleInput.fill("  New requirement  ");
  await create.descriptionInput.fill("  User-visible acceptance criterion.  ");
  await create.submit();

  await expect(page).));
  expect(payloads).toEqual([{
    title: "New requirement",
    description: "User-visible acceptance criterion.",
  }]);
});


test("QA82-TC02 @critical - required fields show linked errors and focus Title", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await create.goto();
  const title = create.titleInput;
  const description = create.descriptionInput;

  await create.submit();

  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(title).toHaveAttribute("aria-describedby", /requirement-title-error/);
  await expect(create.titleError).toBeVisible();

  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-describedby", /requirement-description-error/);
  await expect(create.descriptionError).toBeVisible();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC08 @critical - focus moves to Description when Title is valid", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await create.goto();
  const title = create.titleInput;
  const description = create.descriptionInput;

  await title.fill("A valid requirement title");
  await create.submit();

  await expect(description).toBeFocused();
  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-describedby", /requirement-description-error/);
  await expect(create.descriptionError).toBeVisible();
  await expect(title).toHaveAttribute("aria-invalid", "false");
});

test("QA82-TC05 @critical @mock-api - concurrent submit is blocked while saving", async ({ page }) => {
  const create = new RequirementCreatePage(page);
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

  await create.goto();
  await create.titleInput.fill("Prevent duplicate creation");
  await create.descriptionInput.fill("Only one POST is allowed while a save is pending.");

  try {
    await create.submit();
    await expect(create.submitButton).toBeDisabled();
    await expect(create.submitButton).toHaveText("Saving…");
    await expect.poll(() => postCount).toBe(1);

    // Simulate a second submit event during the still-pending API request.
    // The synchronous submission lock must reject it.
    await create.form.dispatchEvent("submit", {
      bubbles: true,
      cancelable: true,
    });
    expect(postCount).toBe(1);
  } finally {
    finishRequest();
  }

  await expect(page).toHaveURL(new RegExp(`/requirements/${createdId}import { test, expect } from "@playwright/test";
import { RequirementsWorkbenchPage } from "../pages/requirements-workbench.page";
import { RequirementCreatePage } from "../pages/requirement-create.page";

test("QA82-TC03 @regression - Cancel discards an unsaved draft", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
  await create.goto();

  await create.titleInput.fill("Unsaved draft");
  await create.descriptionInput.fill("This content should be discarded.");
  await create.cancel();
  await expect(page).toHaveURL(/\/$/);

  await workbench.openCreateRequirement();
  await expect(create.titleInput).toBeEmpty();
  await expect(create.descriptionInput).toBeEmpty();
});

test("QA82-TC04 @regression - Back navigation discards an unsaved draft", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
  await workbench.goto();
  await workbench.openCreateRequirement();
  await create.titleInput.fill("Temporary value");
  await create.descriptionInput.fill("Temporary details");
  await page.goBack();
  await workbench.openCreateRequirement();

  await expect(create.titleInput).toBeEmpty();
  await expect(create.descriptionInput).toBeEmpty();
});

test("QA82-TC06 @critical @mock-api - friendly failure message retains input", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await page.route("**/api/requirements", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "We couldn't confirm that your requirement was saved. Your information is still here. Check the requirements list before trying again.",
      }),
    });
  });

  await create.goto();
  await create.titleInput.fill("Unsaved after interruption");
  await create.descriptionInput.fill("Keep these details in the form.");
  await create.submit();

  await expect(create.formError).toContainText("We couldn't confirm that your requirement was saved.");
  await expect(create.formError).not.toContainText(/FastAPI|PostgreSQL|API unavailable|server/i);
  await expect(create.titleInput).toHaveValue("Unsaved after interruption");
  await expect(create.descriptionInput).toHaveValue("Keep these details in the form.");
  await expect(create.submitButton).toBeEnabled();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC01 @critical @mock-api - successful creation redirects to requirement details", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  const workbench = new RequirementsWorkbenchPage(page);
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

  await workbench.goto();
  await workbench.openCreateRequirement();
  await expect(page).toHaveURL(/\/requirements\/new$/);

  await create.titleInput.fill("  New requirement  ");
  await create.descriptionInput.fill("  User-visible acceptance criterion.  ");
  await create.submit();

  await expect(page).toHaveURL(`http://127.0.0.1:3000/requirements/${createdId}`);
  expect(payloads).toEqual([{
    title: "New requirement",
    description: "User-visible acceptance criterion.",
  }]);
});


test("QA82-TC02 @critical - required fields show linked errors and focus Title", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await create.goto();
  const title = create.titleInput;
  const description = create.descriptionInput;

  await create.submit();

  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(title).toHaveAttribute("aria-describedby", /requirement-title-error/);
  await expect(create.titleError).toBeVisible();

  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-describedby", /requirement-description-error/);
  await expect(create.descriptionError).toBeVisible();
  await expect(page).toHaveURL(/\/requirements\/new$/);
});

test("QA82-TC08 @critical - focus moves to Description when Title is valid", async ({ page }) => {
  const create = new RequirementCreatePage(page);
  await create.goto();
  const title = create.titleInput;
  const description = create.descriptionInput;

  await title.fill("A valid requirement title");
  await create.submit();

  await expect(description).toBeFocused();
  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveAttribute("aria-describedby", /requirement-description-error/);
  await expect(create.descriptionError).toBeVisible();
  await expect(title).toHaveAttribute("aria-invalid", "false");
});

test("QA82-TC05 @critical @mock-api - concurrent submit is blocked while saving", async ({ page }) => {
  const create = new RequirementCreatePage(page);
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

  await create.goto();
  await create.titleInput.fill("Prevent duplicate creation");
  await create.descriptionInput.fill("Only one POST is allowed while a save is pending.");

  try {
    await create.submit();
    await expect(create.submitButton).toBeDisabled();
    await expect(create.submitButton).toHaveText("Saving…");
    await expect.poll(() => postCount).toBe(1);

    // Simulate a second submit event during the still-pending API request.
    // The synchronous submission lock must reject it.
    await create.form.dispatchEvent("submit", {
      bubbles: true,
      cancelable: true,
    });
    expect(postCount).toBe(1);
  } finally {
    finishRequest();
  }

  await expect(page).));
  expect(postCount).toBe(1);
});
