"use client";

import { useState, type FormEvent } from "react";
import { maxJiraPreviewBytes, type previewJiraIssues } from "@/lib/jira-preview";

type Issue = ReturnType<typeof previewJiraIssues>[number];
const example = JSON.stringify({ issues: [{
  key: "DEMO-17", fields: {
    summary: "Display a synthetic confirmation",
    description: "Show the result.\n\nAcceptance Criteria\n- Confirm the synthetic result is visible.",
    status: { name: "To Do" }, priority: { name: "Medium" },
  },
}] }, null, 2);

export function JiraPreview() {
  const [input, setInput] = useState("");
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIssues(null);
    setError("");
    if (new TextEncoder().encode(input).length > maxJiraPreviewBytes) {
      setError("Fixture exceeds 128 KiB.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/imports/jira-preview", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: input,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Preview unavailable.");
        return;
      }
      setIssues(result.issues);
    } catch {
      setError("Preview unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <label htmlFor="jira-fixture" className="block font-semibold">Synthetic Jira issue JSON</label>
        <p id="jira-help" className="text-sm text-slate-600">
          Paste a fixture with an issues array. This preview uses synthetic data and creates no requirements.
        </p>
        <textarea id="jira-fixture" aria-describedby="jira-help" value={input} onChange={(event) => {
          setInput(event.target.value);
          setIssues(null);
          setError("");
        }} rows={10} maxLength={maxJiraPreviewBytes} disabled={busy} required spellCheck={false}
          className="w-full rounded-md border border-slate-400 p-3 font-mono text-sm" />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || Boolean(input)} onClick={() => setInput(example)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-60">Insert sample</button>
          <button disabled={busy || !input.trim()} className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-60">
            Preview requirements
          </button>
        </div>
      </form>
      {busy && <p role="status">Preparing preview…</p>}
      {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-rose-800">{error}</p>}
      {issues && <p role="status">{issues.length ? `${issues.length} issues in preview.` : "No issues in this fixture."}</p>}
      {issues?.map((issue, index) => (
        <article key={issue.key + "-" + index} className="space-y-3 break-words rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">{issue.title}</h2>
          <p className="font-mono text-sm">{issue.sourceReference} · {issue.source}</p>
          <p className="whitespace-pre-wrap text-sm">{issue.description ?? "Description unavailable."}</p>
          <p className="text-sm">Status {issue.status ?? "Unavailable"} · Priority {issue.priority ?? "Unavailable"}</p>
          {issue.acceptanceCriteria.length > 0 && <>
            <h3 className="font-medium">Acceptance criteria</h3>
            <ul className="list-disc pl-5 text-sm">
              {issue.acceptanceCriteria.map((criterion, position) => <li key={position}>{criterion}</li>)}
            </ul>
          </>}
          {issue.warnings.length > 0 && <ul aria-label="Mapping warnings" className="list-disc pl-5 text-sm text-amber-900">
            {issue.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>}
        </article>
      ))}
    </div>
  );
}
