import assert from "node:assert/strict";
import test from "node:test";
import { previewJiraIssues } from "../../src/lib/jira-preview.ts";

const valid = { key: "DEMO-7", fields: {
  summary: "Confirmation", description: "Overview\n- ignored\nAcceptance Criteria:\n1. Shows result\nNotes\n- ignored",
  status: { name: "Open" }, priority: { name: "High" },
} };

test("maps explicit criteria and identifiable provenance", () => {
  const [issue] = previewJiraIssues({ issues: [valid] });
  assert.deepEqual(issue.acceptanceCriteria, ["Shows result"]);
  assert.equal(issue.sourceReference, "Jira issue DEMO-7");
  assert.equal(issue.source, "JIRA_FIXTURE");
  assert.equal(issue.status, "Open");
  assert.equal(issue.priority, "High");
  assert.deepEqual(issue.warnings, []);
});

test("reports missing and unsupported fields without inferring criteria", () => {
  const [issue] = previewJiraIssues({ issues: [
    { key: "DEMO-8", fields: { summary: "Example", description: { type: "doc" }, status: 42 } },
  ] });
  assert.deepEqual(issue.acceptanceCriteria, []);
  assert.equal(issue.description, null);
  assert.equal(issue.priority, null);
  assert.deepEqual(issue.warnings, [
    "Description format or length is unsupported.", "Status format or length is unsupported.",
    "Priority is missing.", "No explicit acceptance criteria list found.",
  ]);
});

test("flags all occurrences of a duplicate key without dropping rows", () => {
  const rows = previewJiraIssues({ issues: [valid, { ...valid, key: "DEMO-8" }, valid] });
  assert.deepEqual(rows.map((item) => item.duplicate), [true, false, true]);
});

test("rejects invalid structure and required fields", () => {
  for (const input of [null, {}, { issues: [], other: [] }, { issues: [null] },
    { issues: [{ ...valid, key: "broken" }] }, { issues: [{ ...valid, fields: { summary: "" } }] },
    { issues: [{ ...valid, fields: { summary: "x".repeat(256) } }] },
    { issues: Array(51).fill(valid) }]) {
    assert.throws(() => previewJiraIssues(input));
  }
  assert.deepEqual(previewJiraIssues({ issues: [] }), []);
});
