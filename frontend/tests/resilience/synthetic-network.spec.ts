import { expect, test, type Page } from "@playwright/test";

function hold() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  return { pending, release };
}

async function restrictBrowserNetwork(page: Page) {
  await page.route("**/*", (route) => new URL(route.request().url()).origin === "http://127.0.0.1:13033"
    ? route.continue() : route.abort());
}

test("QA-77 network failure preserves excerpt and permits retry @mock-api", async ({ page }) => {
  await restrictBrowserNetwork(page);
  const firstRequest = hold();
  let calls = 0;
  const excerpt = "TimeoutError: synthetic QA-77 retry sample";
  await page.route("**/api/failure-analysis", async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({ excerpt });
    if (calls === 1) {
      await firstRequest.pending;
      await route.abort("failed");
      return;
    }
    await route.fulfill({ json: {
      classification: "TIMEOUT", indicator: "Synthetic timing indicator",
      suggested_next_step: "Review synthetic timing.", confidence: "HEURISTIC",
      review_required: true, execution_status: "NOT_EXECUTED",
    } });
  });

  await page.goto("/failure-analysis");
  const form = page.getByTestId("failure-workbench");
  const analyze = form.getByTestId("failure-analyze");
  await form.getByTestId("failure-excerpt").fill(excerpt);
  await analyze.click();
  try {
    await expect(analyze).toBeDisabled();
    await expect(analyze).toHaveText(/Analyzing/);
  } finally {
    firstRequest.release();
  }
  await expect(form.getByRole("alert")).toContainText("Unable to analyze the excerpt");
  await expect(form.getByTestId("failure-excerpt")).toHaveValue(excerpt);
  await expect(form.getByTestId("failure-result")).toHaveCount(0);
  await analyze.click();
  await expect(form.getByTestId("failure-result")).toContainText("NOT_EXECUTED");
  await expect(form.getByRole("alert")).toHaveCount(0);
  expect(calls).toBe(2);
});

test("QA-77 risk loading and HTTP 503 are distinct from an empty registry @mock-api", async ({ page }) => {
  await restrictBrowserNetwork(page);
  const failure = hold();
  let recovered = false;
  await page.route("**/api/risk/requirements", async (route) => {
    if (recovered) {
      await route.fulfill({ json: { items: [], total: 0, limit: 200, offset: 0 } });
    } else {
      await failure.pending;
      await route.fulfill({ status: 503, json: { detail: "Synthetic risk service unavailable." } });
    }
  });

  await page.goto("/risk");
  const view = page.getByTestId("risk-workbench");
  try {
    await expect(view.getByRole("status")).toContainText("Loading risk assessments");
    await expect(view.getByText("No active requirements found.")).toHaveCount(0);
  } finally {
    failure.release();
  }
  await expect(view.getByRole("alert")).toContainText("Synthetic risk service unavailable");
  await expect(view.getByRole("status")).toHaveCount(0);
  await expect(view.getByText("No active requirements found.")).toHaveCount(0);
  recovered = true;
  await page.reload();
  await expect(view.getByText("No active requirements found.")).toBeVisible();
  await expect(view.getByRole("alert")).toHaveCount(0);
});
