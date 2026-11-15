import type { Locator, Page } from "@playwright/test";

/** QA-84 Page Object: business locators/actions; assertions remain in specs. */
export class RequirementEditPage {
  readonly form: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId("requirement-edit-form");
    this.title = page.getByTestId("requirement-edit-title");
    this.description = page.getByTestId("requirement-edit-description");
    this.submit = page.getByTestId("requirement-edit-submit");
    this.cancel = page.getByRole("link", { name: "Cancel", exact: true });
    this.error = page.getByTestId("requirement-edit-error");
  }

  async goto(id: string): Promise<void> {
    await this.page.goto(`/requirements/${id}/edit`);
  }
}
