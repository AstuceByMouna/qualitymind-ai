import { test, expect } from "@playwright/test";
import { RequirementsWorkbenchPage } from "../pages/requirements-workbench.page";

const prefix = process.env.QA85_FIXTURE_PREFIX;

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!prefix || testInfo.project.use.baseURL !== "http://127.0.0.1:3001",
    "Requires isolated QA services and QA85 fixture.");
  await new RequirementsWorkbenchPage(page).goto();
});

test("QA85-TC01 @real-api @qa-only - find an item beyond the first page", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Search all requirements" });
  await search.fill(`${prefix}-item-07`);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === `${prefix}-item-07`);
  await expect(page.getByRole("link", { name: `${prefix}-item-07` })).toBeVisible();
  await expect(page.getByText("1 total")).toBeVisible();
});

test("QA85-TC02 @real-api @qa-only - blank and clear return unfiltered list", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Search all requirements" });
  await search.fill(prefix!);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === prefix);
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/" && !url.searchParams.has("q"));
  await expect(page.getByRole("searchbox", { name: "Search all requirements" })).toBeEmpty();
  await expect(page.getByText("No matching requirements found.")).toHaveCount(0);
});

test("QA85-TC03 @real-api @qa-only - zero results have a clear empty state", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search all requirements" })
    .fill(`${prefix}-never-matches`);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No matching requirements found.")).toBeVisible();
  await expect(page.getByText("0 total")).toBeVisible();
});

test("QA85-TC04 @real-api @qa-only - filtered counts, pages and URL are stable", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search all requirements" }).fill(prefix!);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("9 total")).toBeVisible();
  await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
  const next = page.getByRole("link", { name: "Next" });
  // A Next.js navigation updates the address bar before the streamed
  // RequirementsRegistry replacement finishes. Wait for the NEW page links.
  await expect(next).toHaveAttribute("href", new RegExp(`q=${prefix}`));
  await next.click();
  await expect(page).toHaveURL((url) =>
    url.searchParams.get("q") === prefix && url.searchParams.get("page") === "2");
  await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
  await page.getByRole("link", { name: "Previous" }).click();
  await expect(page).toHaveURL((url) =>
    url.searchParams.get("q") === prefix && !url.searchParams.has("page"));
});

test("QA85-TC05 @real-api @qa-only - LIKE wildcards are treated literally", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search all requirements" }).fill("100%_special");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("link", { name: `${prefix}-100%_special` })).toBeVisible();
  await expect(page.getByText("1 total")).toBeVisible();
});

test("QA85-TC06 @real-api @qa-only - page outside range normalizes URL", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(prefix!)}&page=999`);
  await expect(page).toHaveURL((url) =>
    url.searchParams.get("q") === prefix && url.searchParams.get("page") === "2");
  await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
});
