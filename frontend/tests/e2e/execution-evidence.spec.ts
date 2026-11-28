import { expect, test } from "@playwright/test";

test("QA-127 @mock-api imports one declaration and displays immutable history", async ({ page }) => {
  const rid = "00000000-0000-4000-8000-000000000127";
  const tid = "00000000-0000-4000-8000-000000000128";
  const script = "tests/synthetic.spec.ts";
  const traceUrl = "/requirements/" + rid + "/traceability";
  const path = "/api/test-cases/" + tid + "/execution-evidence";
  const input = {
    test_case_id: tid, external_run_id: "synthetic-run", external_result_id: "synthetic-result",
    script_path: script, tested_commit_sha: "a".repeat(40), outcome: "PASS",
    executed_at: "2026-11-28T13:15:00Z",
  };
  const result = { ...input, id: "synthetic-evidence", requirement_id: rid,
    imported_at: "2026-11-28T13:20:00Z", provenance: "USER_IMPORTED",
    definition_fingerprint: "v1:sha256:synthetic", context_changed: true };
  let imported = false;
  await page.route("**/api" + traceUrl, (route) => route.fulfill({ json: {
    requirement: { id: rid, title: "Synthetic requirement", status: "Draft" },
    criteria: [],
    test_cases: [{
      test_case_id: tid, title: "Synthetic draft", status: "DRAFT", criterion_id: null,
      criterion_link: "MISSING", playwright_script_path: script, execution_status: "NOT_EXECUTED",
    }],
  } }));
  await page.route("**" + path + "**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { items: imported ? [result] : [], next_offset: null } });
      return;
    }
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual(input);
    const status = imported ? 200 : 201;
    imported = true;
    await route.fulfill({ status, json: result });
  });
  await page.goto(traceUrl);
  await page.getByRole("button", { name: "Open execution evidence" }).click();
  await expect(page.getByText("No imported evidence.")).toBeVisible();
  await page.getByRole("button", { name: "Insert JSON template" }).click();
  const editor = page.getByTestId("execution-evidence-json");
  await expect(editor).toHaveValue(new RegExp(tid));
  await editor.fill(JSON.stringify(input));
  await page.getByRole("button", { name: "Import external result" }).click();
  await expect(page.getByRole("status").filter({ hasText: "External result imported." })).toBeVisible();
  const row = page.getByTestId("execution-evidence-row");
  await expect(row).toContainText("PASS · USER_IMPORTED");
  await expect(row).toContainText(input.tested_commit_sha);
  await expect(row).toContainText(script);
  await expect(row).toContainText("changed since import");
  await editor.fill(JSON.stringify(input));
  await page.getByRole("button", { name: "Import external result" }).click();
  await expect(page.getByRole("status").filter({ hasText: "This result was already imported." })).toBeVisible();
  await expect(row).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Open execution evidence" }).click();
  await expect(row).toHaveCount(1);
  await expect(page.getByTestId("traceability-test")).toContainText("DRAFT");
  await expect(page.getByTestId("traceability-test")).toContainText("NOT_EXECUTED");
});
