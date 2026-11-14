import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for the Requirements Workbench.
 * Locators and navigation are kept here; assertions stay in the specs.
 */
export class RequirementsWorkbenchPage {
  readonly heading: Locator;
  readonly intelligenceHeading: Locator;
  readonly createRequirementLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", {
      name: "Requirements Workbench",
      exact: true,
    });
    this.intelligenceHeading = page.getByRole("heading", {
      name: "Requirements Intelligence",
      exact: true,
    });
    this.createRequirementLink = page.getByTestId("requirement-create-link");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async openCreateRequirement(): Promise<void> {
    await this.createRequirementLink.click();
  }
}
