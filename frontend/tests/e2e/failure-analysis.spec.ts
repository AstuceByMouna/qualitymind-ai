import { expect, test } from "@playwright/test";

test("QA-124 @mock-api classifies synthetic failure with honest human-review label", async ({ page }) => {
  let callCount = 0;
  await page.route("**/api/failure-analysis", async (route) => {
    callCount++;
    const payload = route.request().postDataJSON() as { excerpt: string };
    expect(payload.excerpt).toContain("TimeoutError");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        classification: "TIMEOUT",
        indicator: "Timeout indicator",
        suggested_next_step: "Inspect timing and page state.",
        confidence: "HEURISTIC",
        review_required: true,
        execution_status: "NOT_EXECUTED",
      }),
    });
  });

  await page.goto("/failure-analysis");
  await expect(page.getByTestId("failure-workbench")).toBeVisible();
  const analyze = page.getByTestId("failure-analyze");
  await expect(analyze).toBeDisabled();
  await page.getByTestId("failure-excerpt").fill("TimeoutError: synthetic test exceeded 30000ms");
  await analyze.click();
  await expect(page.getByTestId("failure-category")).toHaveText("TIMEOUT");
  await expect(page.getByTestId("failure-result")).toContainText("Human review required");
  await expect(page.getByTestId("failure-result")).toContainText("NOT_EXECUTED");
  expect(callCount).toBe(1);

  await page.getByTestId("failure-excerpt").fill("Changed synthetic input");
  await expect(page.getByTestId("failure-result")).toHaveCount(0);
});
