import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for the New Requirement form.
 * Exposes stable business locators and user actions; no assertions or API mocks.
 */
export class RequirementCreatePage {
  readonly form: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelLink: Locator;
  readonly formError: Locator;
  readonly titleError: Locator;
  readonly descriptionError: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId("requirement-create-form");
    this.titleInput = page.getByTestId("requirement-title");
    this.descriptionInput = page.getByTestId("requirement-description");
    this.submitButton = page.getByTestId("requirement-create-submit");
    this.cancelLink = page.getByRole("link", { name: "Cancel", exact: true });
    this.formError = page.getByTestId("requirement-create-error");
    this.titleError = page.locator("#requirement-title-error");
    this.descriptionError = page.locator("#requirement-description-error");
  }

  async goto(): Promise<void> {
    await this.page.goto("/requirements/new");
  }

  async fill(title: string, description: string): Promise<void> {
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelLink.click();
  }
}
