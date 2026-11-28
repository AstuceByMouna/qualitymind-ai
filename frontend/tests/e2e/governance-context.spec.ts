import { expect, test, type Page } from "@playwright/test";

const releaseA = { id: "00000000-0000-4000-8000-000000000101", name: "Release Alpha", version: "1.0" };
const releaseB = { id: "00000000-0000-4000-8000-000000000102", name: "Release Beta", version: "2.0" };
const obligation = { id: "00000000-0000-4000-8000-000000000103", title: "Alpha obligation", critical: true, evidence_status: "PASS" };
const requirement = { id: "00000000-0000-4000-8000-000000000104", title: "Alpha requirement", archived_at: null };
const common = { version: releaseA.version, obligation_id: obligation.id, owner: "QA", source: "Synthetic",
  severity: "HIGH", status: "OPEN_UNQUALIFIED", plausible_harm: null, required_evidence: null };
const objectionA = { ...common, id: "00000000-0000-4000-8000-000000000105", reason: "Objection Alpha" };
const objectionB = { ...common, id: "00000000-0000-4000-8000-000000000106", reason: "Objection Beta" };
const releases = "/api/governance/releases";
const alpha = releases + "/" + releaseA.id;
const beta = releases + "/" + releaseB.id;
const challenges = alpha + "/challenges";
const historyA = challenges + "/" + objectionA.id + "/history";
const historyB = challenges + "/" + objectionB.id + "/history";
const alphaReadiness = { state: "REVIEW_REQUIRED", explanation: "Alpha evidence decision", obligations: [obligation] };

function deferred() {
  let finish!: () => void;
  const promise = new Promise<void>((resolve) => { finish = resolve; });
  return { promise, finish };
}

async function chooseAlpha(page: Page) {
  await page.goto("/governance");
  await page.getByRole("button", { name: /Release Alpha/ }).click();
  await expect(page.getByTestId("release-readiness")).toContainText("Alpha evidence decision");
}

test("R106-01 @mock-api new release suppresses Alpha context during a delayed and failed readiness load", async ({ page }) => {
  const releaseResponse = deferred();
  let created = false;
  let fail = true;
  let betaRequested = false;
  await page.route("**/api/governance/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === releases && route.request().method() === "POST") {
      created = true;
      await route.fulfill({ status: 201, json: releaseB });
    } else if (path === releases) {
      await route.fulfill({ json: created ? [releaseA, releaseB] : [releaseA] });
    } else if (path === "/api/governance/requirements") {
      await route.fulfill({ json: { items: [requirement] } });
    } else if (path === alpha + "/readiness") {
      await route.fulfill({ json: alphaReadiness });
    } else if (path === beta + "/readiness") {
      betaRequested = true;
      await releaseResponse.promise;
      await route.fulfill(fail
        ? { status: 503, json: { error: "Beta assessment unavailable." } }
        : { json: { state: "UNDETERMINED", explanation: "Beta evidence pending", obligations: [] } });
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await chooseAlpha(page);
  await page.getByLabel("Related requirement").selectOption(requirement.id);
  await page.getByRole("textbox", { name: "Obligation", exact: true }).fill("Draft Alpha obligation");
  await page.getByLabel("Evidence reference").fill("Alpha run");
  await page.getByRole("combobox", { name: "Obligation", exact: true }).selectOption(obligation.id);
  await page.getByTestId("release-name").fill(releaseB.name);
  await page.getByTestId("release-version").fill(releaseB.version);
  await page.getByTestId("create-release").click();
  await expect.poll(() => betaRequested).toBe(true);
  try {
    await expect(page.getByText("Release Beta · 2.0", { exact: false }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: /Release Alpha/ })).toBeDisabled();
    await expect.soft(page.getByTestId("release-readiness")).toHaveCount(0, { timeout: 600 });
    await expect.soft(page.getByText("Alpha obligation", { exact: true })).toHaveCount(0, { timeout: 600 });
  } finally {
    releaseResponse.finish();
  }
  await expect(page.getByRole("alert").filter({ hasText: "Beta assessment unavailable" })).toBeVisible();
  await expect.soft(page.getByTestId("release-readiness")).toHaveCount(0, { timeout: 600 });

  fail = false;
  await page.getByRole("button", { name: /Release Beta/ }).click();
  await expect(page.getByTestId("release-readiness")).toContainText("Beta evidence pending");
  await expect(page.getByRole("textbox", { name: "Obligation", exact: true })).toHaveValue("");
  await expect(page.getByLabel("Evidence reference")).toHaveValue("");
  await expect(page.getByLabel("Tested software version")).toHaveValue("2.0");
});

async function mockObjections(page: Page, options: { failAssessment?: boolean } = {}) {
  const transition = deferred();
  const oldHistory = deferred();
  let rejected = false;
  let holdOldHistory = false;
  let transitionStarted = false;
  let rejectionReason = "";
  await page.route("**/api/governance/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === releases) await route.fulfill({ json: [releaseA] });
    else if (path === "/api/governance/requirements") await route.fulfill({ json: { items: [] } });
    else if (path === alpha + "/readiness") await route.fulfill({ json: alphaReadiness });
    else if (path === challenges) await route.fulfill({ json: [
      { ...objectionA, status: rejected ? "REJECTED" : objectionA.status }, objectionB,
    ] });
    else if (path === challenges + "/assessment") {
      if (rejected && options.failAssessment) {
        await route.fulfill({ status: 503, json: { error: "Combined assessment unavailable." } });
      } else {
        await route.fulfill({ json: {
          state: "REVIEW_REQUIRED", dc01_state: "REVIEW_REQUIRED",
          explanation: rejected ? "Updated combined decision" : "Initial combined decision",
          qualifying_critical_challenge_ids: [], challenges_total: 2, qualified_open: 0,
        } });
      }
    } else if (path === challenges + "/" + objectionA.id + "/transitions") {
      transitionStarted = true;
      const body = route.request().postDataJSON();
      expect(body.to_status).toBe("REJECTED");
      rejectionReason = body.justification;
      await transition.promise;
      rejected = true;
      await route.fulfill({ json: { ...objectionA, status: "REJECTED" } });
    } else if (path === historyA || path === historyB) {
      const isAlpha = path === historyA;
      if (isAlpha && holdOldHistory && !rejected) await oldHistory.promise;
      await route.fulfill({ json: [{
        id: isAlpha ? "history-alpha" : "history-beta", from_status: null,
        to_status: rejected && isAlpha ? "REJECTED" : "OPEN_UNQUALIFIED",
        actor: "Synthetic QA", justification: rejected && isAlpha ? rejectionReason : isAlpha ? "Alpha history" : "Beta history",
        created_at: "2026-11-20T00:00:00Z",
      }] });
    } else await route.fulfill({ status: 404, json: {} });
  });
  return { transition, transitionStarted: () => transitionStarted, oldHistory,
    holdAlphaHistory: () => { holdOldHistory = true; },
    recoverAssessment: () => { options.failAssessment = false; } };
}

async function enterChallenger(page: Page) {
  await chooseAlpha(page);
  await page.getByRole("button", { name: "Decision Challenger", exact: true }).click();
  await expect(page.getByRole("region", { name: "Combined decision" })).toContainText("Initial combined decision");
}

async function rejectAlpha(page: Page) {
  await page.getByRole("button", { name: /Objection Alpha/ }).click();
  const reject = page.getByRole("button", { name: "Reject with reason" });
  await expect(reject).toBeDisabled();
  await page.getByLabel("Decision justification").fill("Synthetic rejection justification");
  await reject.click();
}

test("R106-02 @mock-api a late transition refresh cannot replace the selected objection history", async ({ page }) => {
  const mock = await mockObjections(page);
  await enterChallenger(page);
  await rejectAlpha(page);
  await expect.poll(mock.transitionStarted).toBe(true);
  try {
    await page.getByRole("button", { name: "History", exact: true }).click();
    await page.getByRole("combobox", { name: "Objection" }).selectOption(objectionB.id);
    await expect(page.getByTestId("challenge-history")).toContainText("Beta history");
  } finally {
    mock.transition.finish();
  }

  await page.getByRole("button", { name: "Decision Challenger", exact: true }).click();
  await expect(page.getByTestId("challenge-list")).toContainText("REJECTED");
  await expect(page.getByTestId("create-challenge")).toBeEnabled();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Objection" })).toHaveValue(objectionB.id);
  await expect(page.getByTestId("challenge-history")).toContainText("Beta history");

  await page.reload();
  await page.getByRole("button", { name: /Release Alpha/ }).click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page.getByRole("combobox", { name: "Objection" }).selectOption(objectionA.id);
  await expect(page.getByTestId("challenge-history")).toContainText("REJECTED");
  await expect(page.getByTestId("challenge-history")).toContainText("Synthetic rejection justification");
});

test("R106-02 @mock-api a failed assessment refresh removes the old combined decision", async ({ page }) => {
  const mock = await mockObjections(page, { failAssessment: true });
  await enterChallenger(page);
  await rejectAlpha(page);
  await expect.poll(mock.transitionStarted).toBe(true);
  mock.transition.finish();
  await expect(page.getByRole("alert").filter({ hasText: "Combined assessment unavailable" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Combined decision" })).toHaveCount(0);
  await expect(page.getByTestId("create-challenge")).toBeDisabled();
  mock.recoverAssessment();
  await page.getByRole("button", { name: "Retry assessment" }).click();
  await expect(page.getByRole("region", { name: "Combined decision" })).toContainText("Updated combined decision");
  await expect(page.getByTestId("challenge-list")).toContainText("REJECTED");
});

test("R106-02 @mock-api history reads completing out of order keep the current objection", async ({ page }) => {
  const mock = await mockObjections(page);
  await enterChallenger(page);
  await page.getByRole("button", { name: "History", exact: true }).click();
  const select = page.getByRole("combobox", { name: "Objection" });
  mock.holdAlphaHistory();
  const requested = page.waitForRequest((request) => new URL(request.url()).pathname === historyA);
  const completed = page.waitForResponse((response) => new URL(response.url()).pathname === historyA);
  await select.selectOption(objectionA.id);
  try {
    await requested;
    await select.selectOption(objectionB.id);
    await expect(page.getByTestId("challenge-history")).toContainText("Beta history");
  } finally {
    mock.oldHistory.finish();
  }
  expect((await completed).status()).toBe(200);
  await expect(page.getByTestId("challenge-history")).toContainText("Beta history");
  await expect(select).toHaveValue(objectionB.id);
});
