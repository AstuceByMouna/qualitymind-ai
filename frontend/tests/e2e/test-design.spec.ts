import { expect, test } from "@playwright/test";

const REQ = "00000000-0000-4000-8000-000000000081";
const CRITERION = "00000000-0000-4000-8000-000000000082";
const SAVED = "00000000-0000-4000-8000-000000000083";
const base = `/api/test-design/requirements/${REQ}/test-cases`;

test("QA-107 @smoke @mock-api suggest and save only review-required drafts", async ({ page }) => {
  let persisted = false;
  const positive = {
    criterion_id: CRITERION,
    source_criterion: "Given valid credentials, access is granted.",
    kind: "POSITIVE", title: "AC-1 — Verify stated acceptance outcome",
    preconditions: "Prepare the valid context.",
    steps: "1. Submit valid credentials.\\n2. Observe result.",
    expected_result: "Confirm the source acceptance outcome.",
    requires_rule_clarification: false,
  };
  const negative = {
    ...positive, kind: "NEGATIVE",
    title: "AC-1 — Explore invalid or missing input (review required)",
    expected_result: "NOT SPECIFIED by the source criterion. Define expected behavior.",
    requires_rule_clarification: true,
  };

  await page.route("**/api/test-design/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const method = route.request().method();
    let status = 200;
    let result: unknown;
    if (pathname === "/api/test-design/requirements") {
      result = { items: [{ id: REQ, title: "QA107 synthetic requirement", archived_at: null }] };
    } else if (pathname === base + "/suggestions") {
      result = [positive, negative];
    } else if (pathname === base && method === "POST") {
      if (persisted) {
        status = 409;
        result = { detail: "Duplicate draft" };
      } else {
        status = 201;
        persisted = true;
        result = { ...positive, id: SAVED, requirement_id: REQ, status: "DRAFT", generator_version: "rules-v1", created_at: "2026-11-25T00:00:00Z" };
      }
    } else if (pathname === base) {
      result = persisted ? [{ ...positive, id: SAVED, requirement_id: REQ, status: "DRAFT", generator_version: "rules-v1", created_at: "2026-11-25T00:00:00Z" }] : [];
    } else {
      status = 404;
      result = { error: "No mock" };
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(result) });
  });

  await page.goto("/test-design");
  await expect(page.getByTestId("test-design-workbench")).toBeVisible();
  await page.getByTestId("test-design-requirement").selectOption(REQ);
  await expect(page.getByRole("heading", { name: "Suggested cases (2)" })).toBeVisible();
  await expect(page.getByText("NOT SPECIFIED by the source criterion.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saved drafts (0)" })).toBeVisible();
  await page.getByTestId("test-design-save").first().click();
  await expect(page.getByRole("heading", { name: "Saved drafts (1)" })).toBeVisible();
  await expect(page.getByText("DRAFT", { exact: true })).toBeVisible();
  await expect(page.getByTestId("test-design-save").first()).toBeDisabled();
  await page.reload();
  await page.getByTestId("test-design-requirement").selectOption(REQ);
  await expect(page.getByRole("heading", { name: "Saved drafts (1)" })).toBeVisible();
});
