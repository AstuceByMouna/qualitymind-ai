import { expect, test } from "@playwright/test";

const RELEASE = "00000000-0000-4000-8000-000000000061";
const OBLIGATION = "00000000-0000-4000-8000-000000000062";
const CHALLENGE = "00000000-0000-4000-8000-000000000063";
const base = `/api/governance/releases/${RELEASE}/challenges`;

test("QA-103 @smoke @mock-api unqualified objection cannot block; qualification requires harm and proof", async ({ page }) => {
  let saved = false;
  let challengeStatus = "OPEN_UNQUALIFIED";
  const history = [{ id: "created", from_status: null as string | null,
    to_status: challengeStatus, actor: "QA reviewer", justification: "Created",
    created_at: "2026-11-20T00:00:00Z" }];
  const qualified = () => challengeStatus === "QUALIFIED";
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route("**/api/governance/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    let status = 200;
    let response: unknown;

    if (path === "/api/governance/releases") {
      response = [{ id: RELEASE, name: "QA-103 synthetic demo", version: "2026.11.19", created_at: "2026-11-20T00:00:00Z" }];
    } else if (path === "/api/governance/requirements") {
      response = { items: [] };
    } else if (path === `/api/governance/releases/${RELEASE}/readiness`) {
      response = {
        state: "REVIEW_REQUIRED", explanation: "Human review required.",
        obligations: [{ id: OBLIGATION, title: "Verify critical requirement acceptance", critical: true, evidence_status: "PASS" }],
      };
    } else if (path === base && method === "POST") {
      saved = true;
      status = 201;
      response = {
        id: CHALLENGE, obligation_id: OBLIGATION, release_id: RELEASE, version: "2026.11.19",
        source: "Manual UAT", owner: "QA reviewer (unverified)",
        reason: "Synthetic critical objection", severity: "CRITICAL", status: "OPEN_UNQUALIFIED",
        plausible_harm: null, required_evidence: null,
        created_at: "2026-11-20T00:00:00Z", updated_at: "2026-11-20T00:00:00Z",
      };
    } else if (path === base && method === "GET") {
      response = saved ? [{
        id: CHALLENGE, obligation_id: OBLIGATION, release_id: RELEASE, version: "2026.11.19",
        source: "Manual UAT", owner: "QA reviewer (unverified)",
        reason: "Synthetic critical objection", severity: "CRITICAL", status: challengeStatus,
        plausible_harm: qualified() ? "Risk of missing proof" : null,
        required_evidence: qualified() ? "Independent review log" : null,
        created_at: "2026-11-20T00:00:00Z", updated_at: "2026-11-20T00:00:00Z",
      }] : [];
    } else if (path === `${base}/assessment`) {
      response = {
        dc01_state: "REVIEW_REQUIRED", state: qualified() ? "NO_GO" : "REVIEW_REQUIRED",
        explanation: qualified() ? "Qualified critical objection" : "Human review required.",
        qualifying_critical_challenge_ids: qualified() ? [CHALLENGE] : [],
        challenges_total: saved ? 1 : 0, qualified_open: qualified() ? 1 : 0,
      };
    } else if (path === `${base}/${CHALLENGE}/history`) {
      response = history;
    } else if (path === `${base}/${CHALLENGE}/transitions` && method === "POST") {
      const payload = route.request().postDataJSON() as {
        plausible_harm?: string; required_evidence?: string; to_status: string; justification: string;
      };
      if (payload.to_status === "QUALIFIED" && (!payload.plausible_harm || !payload.required_evidence)) {
        status = 422; response = { error: "Qualification requires a harm and required evidence." };
      } else {
        history.push({ id: String(history.length), from_status: challengeStatus, to_status: payload.to_status,
          actor: "QA reviewer", justification: payload.justification, created_at: "2026-11-20T00:00:00Z" });
        challengeStatus = payload.to_status;
        response = { id: CHALLENGE, status: challengeStatus };
      }
    } else {
      status = 404;
      response = { error: "Unknown mocked request" };
    }

    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(response) });
  });

  await page.goto("/governance");
  await page.getByRole("button", { name: /QA-103 synthetic demo/ }).click();
  await expect(page.getByText("Selected release")).toBeVisible();
  const challenger = page.getByRole("button", { name: "Decision Challenger", exact: true });
  await challenger.focus();
  await challenger.press("Enter");
  await expect(challenger).toBeFocused();
  await expect(challenger).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("decision-challenger")).toBeVisible();
  await expect(page.getByTestId("challenger-assessment")).toContainText("REVIEW_REQUIRED");
  await page.getByTestId("challenge-obligation").selectOption(OBLIGATION);
  await page.getByTestId("challenge-reason").fill("Synthetic critical objection");
  await page.getByRole("combobox", { name: "Severity" }).selectOption("CRITICAL");
  await page.getByTestId("create-challenge").click();
  await expect(page.getByTestId("challenge-list")).toContainText("OPEN_UNQUALIFIED");
  await expect(page.getByTestId("challenger-assessment")).toContainText("REVIEW_REQUIRED");
  await page.getByRole("button", { name: /Synthetic critical objection/ }).click();
  await expect(page.getByTestId("qualify-challenge")).toBeDisabled();
  await page.getByRole("textbox", { name: "Plausible harm" }).fill("Risk of missing proof");
  await page.getByRole("textbox", { name: "Required evidence" }).fill("Independent review log");
  await page.getByRole("textbox", { name: "Decision justification" }).fill("Synthetic qualification, not an approval");
  await page.getByTestId("qualify-challenge").click();
  await expect(page.getByTestId("challenge-list")).toContainText("QUALIFIED");
  await expect(page.getByTestId("challenger-assessment")).toContainText("NO_GO");
  await expect(page.getByTestId("decision-challenger")).not.toContainText("GO approved");
  await expect(page.getByRole("region", { name: "DC-01 baseline" })).toContainText("REVIEW_REQUIRED");
  await expect(page.getByRole("region", { name: "Combined decision" })).toContainText("Hold the release");
  await expect(page.getByTestId("challenger-assessment")).toContainText("Synthetic critical objection");
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByTestId("challenge-history")).toContainText("Created");
  await expect(page.getByTestId("challenge-review")).toHaveCount(0);
  await page.getByRole("button", { name: "Decision Challenger", exact: true }).click();
  await page.getByRole("textbox", { name: "Decision justification" }).fill("Synthetic evidence reviewed");
  await page.getByRole("button", { name: "Resolve", exact: true }).click();
  await expect(page.getByTestId("challenge-list")).toContainText("RESOLVED");
  await expect(page.getByRole("region", { name: "Combined decision" })).toContainText("REVIEW_REQUIRED");
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByTestId("challenge-history")).toContainText("Synthetic evidence reviewed");
  await expect(page.getByText("Selected release")).toBeVisible();
});
