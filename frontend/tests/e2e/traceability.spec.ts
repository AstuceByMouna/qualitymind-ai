import { expect, test } from "@playwright/test";

const requirementId = "00000000-0000-4000-8000-000000000126";
const criterionId = "00000000-0000-4000-8000-000000000127";
const linkedId = "00000000-0000-4000-8000-000000000128";
const missingId = "00000000-0000-4000-8000-000000000129";
const inconsistentId = "00000000-0000-4000-8000-000000000130";
const foreignCriterion = "00000000-0000-4000-8000-000000000131";
const pageUrl = "/requirements/" + requirementId + "/traceability";
const apiPattern = "**/api/requirements/" + requirementId + "/traceability";
const requirement = { id: requirementId, title: "Synthetic requirement", status: "Ready" };

test("QA-126 @mock-api navigates exact links and exposes missing evidence", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) apiRequests.push(request.method() + " " + url.pathname);
  });
  const base = { status: "DRAFT", execution_status: "NOT_EXECUTED", requirement_id: requirementId };
  await page.route(apiPattern, (route) => route.fulfill({ json: {
    requirement,
    criteria: [{ id: criterionId, requirement_id: requirementId, content: "Synthetic source", position: 1 }],
    test_cases: [
      { ...base, test_case_id: linkedId, title: "Linked draft", criterion_id: criterionId,
        criterion_link: "LINKED", playwright_script_path: "frontend/tests/e2e/home.spec.ts" },
      { ...base, test_case_id: missingId, title: "Orphan draft", criterion_id: null,
        criterion_link: "MISSING", playwright_script_path: null },
      { ...base, test_case_id: inconsistentId, title: "Inconsistent draft", criterion_id: foreignCriterion,
        criterion_link: "INCONSISTENT", playwright_script_path: null },
    ],
  } }));

  await page.goto(pageUrl + "#test-" + linkedId);
  const criterion = page.getByTestId("traceability-criterion");
  const linked = page.getByTestId("traceability-test").filter({ hasText: "Linked draft" });
  await expect(linked).toBeFocused();
  await expect(page.getByTestId("traceability-view")).toContainText("Ready");
  await expect(criterion).toContainText(criterionId);
  await expect(linked).toContainText(linkedId);
  await expect(linked).toContainText("DRAFT");
  await expect(linked).toContainText("NOT_EXECUTED");
  await expect(linked.locator("code")).toHaveText("frontend/tests/e2e/home.spec.ts");
  await linked.getByRole("link", { name: "Source criterion" }).click();
  await expect(page).toHaveURL(new RegExp("#criterion-" + criterionId + "$"));
  await criterion.getByRole("link", { name: "Linked draft" }).click();
  await expect(page).toHaveURL(new RegExp("#test-" + linkedId + "$"));
  await linked.getByRole("link", { name: "Source requirement" }).click();
  await expect(page).toHaveURL(/#trace-requirement$/);

  const missing = page.getByTestId("traceability-test").filter({ hasText: "Orphan draft" });
  await expect(missing).toContainText("Source criterion missing");
  await expect(missing).toContainText("No script association");
  const inconsistent = page.getByTestId("traceability-test").filter({ hasText: "Inconsistent draft" });
  await expect(inconsistent).toContainText("Source criterion unavailable for this requirement");
  await expect(inconsistent.getByRole("link", { name: "Source criterion" })).toHaveCount(0);
  expect([...new Set(apiRequests)]).toEqual(["GET /api" + pageUrl]);
});

test("QA-126 @mock-api displays loading and an empty requirement", async ({ page }) => {
  let complete!: () => void;
  const wait = new Promise<void>((resolve) => { complete = resolve; });
  await page.route(apiPattern, async (route) => {
    await wait;
    await route.fulfill({ json: { requirement, criteria: [], test_cases: [] } });
  });
  await page.goto(pageUrl, { waitUntil: "domcontentloaded" });
  try {
    await expect(page.getByTestId("traceability-loading")).toBeVisible();
  } finally {
    complete();
  }
  await expect(page.getByText("No acceptance criteria.")).toBeVisible();
  await expect(page.getByText("No associated test cases.")).toBeVisible();
});

for (const [status, message] of [
  [400, "Invalid requirement identifier"],
  [404, "Requirement not found"],
  [409, "This requirement is archived"],
  [503, "Unable to load traceability"],
] as const) {
  test("QA-126 @mock-api handles unavailable traceability " + status, async ({ page }) => {
    await page.route(apiPattern, (route) => route.fulfill({ status, json: {} }));
    await page.goto(pageUrl);
    await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
    await expect(page.getByTestId("traceability-test")).toHaveCount(0);
  });
}
