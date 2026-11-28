"use client";

import { useId, useState, type FormEvent } from "react";

type Evidence = {
  id: string;
  external_run_id: string;
  external_result_id: string;
  script_path: string;
  tested_commit_sha: string;
  executed_at: string;
  imported_at: string;
  outcome: "PASS" | "FAIL" | "SKIPPED" | "ERROR";
  provenance: "USER_IMPORTED";
  definition_fingerprint: string;
  context_changed: boolean;
};

type History = { items: Evidence[]; next_offset: number | null };

const action = "rounded-md border border-slate-300 px-3 py-2 font-medium text-sky-800 hover:bg-sky-50 disabled:opacity-60";
const time = (value: string) => new Date(value).toISOString();

export function ExecutionEvidencePanel({ testCaseId, scriptPath }: {
  testCaseId: string;
  scriptPath: string | null;
}) {
  const label = useId();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<History>();
  const [payload, setPayload] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const url = "/api/test-cases/" + encodeURIComponent(testCaseId) + "/execution-evidence";

  async function readHistory(offset = 0) {
    const response = await fetch(url + "?offset=" + offset, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load imported results.");
    const page: History = await response.json();
    setHistory((previous) => {
      if (!offset || !previous) return page;
      const existing = new Set(previous.items.map((item) => item.id));
      return { items: [...previous.items, ...page.items.filter((item) => !existing.has(item.id))],
        next_offset: page.next_offset };
    });
  }

  async function load(offset = 0) {
    setOpen(true);
    setBusy(true);
    setError("");
    try {
      await readHistory(offset);
    } catch {
      setError("Unable to load imported results. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (new TextEncoder().encode(payload).byteLength > 4096) {
      setError("The JSON result exceeds 4096 bytes.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      });
      if (!response.ok) {
        const messages: Record<number, string> = {
          404: "This test case is unavailable.",
          409: "Import conflicts with an existing result, archived requirement or current script association.",
          413: "The JSON result exceeds 4096 bytes.",
          422: "Enter one valid result for this test case.",
        };
        setError(messages[response.status] ?? "Import could not be confirmed. Retry the same JSON safely.");
        return;
      }
      setNotice(response.status === 200 ? "This result was already imported." : "External result imported.");
      setPayload("");
      try {
        await readHistory();
      } catch {
        setError("The import succeeded. Refresh the history to see it.");
      }
    } catch {
      setError("Import could not be confirmed. Retry the same JSON safely.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-3 border-t border-slate-200 pt-4" aria-labelledby={label + "-heading"}>
      <h4 id={label + "-heading"} className="font-semibold">Imported execution evidence</h4>
      {!open && <button type="button" className={action} aria-expanded={false} onClick={() => void load()}>
        Open execution evidence
      </button>}
      {open && <>
        <p className="text-slate-600">User-declared external outcomes. Script and fingerprint reflect the context at import time.</p>
        {busy && <p role="status">Loading execution evidence…</p>}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button type="button" className={action} disabled={busy} onClick={() => void load()}>Refresh history</button>
        {history?.items.length === 0 && <p>No imported evidence.</p>}
        {history?.items.map((item) => (
          <article key={item.id} className="space-y-2 rounded-md border border-slate-200 p-3" data-testid="execution-evidence-row">
            <h5 className="font-semibold">{item.outcome} · {item.provenance}</h5>
            {item.context_changed && <p className="font-medium text-amber-800">Script association or test definition changed since import.</p>}
            <dl className="grid gap-2 break-all sm:grid-cols-[auto_1fr]">
              <dt>Evidence ID</dt><dd><code>{item.id}</code></dd>
              <dt>External run / result</dt><dd>{item.external_run_id} / {item.external_result_id}</dd>
              <dt>Tested commit</dt><dd><code>{item.tested_commit_sha}</code></dd>
              <dt>Script snapshot</dt><dd><code>{item.script_path}</code></dd>
              <dt>Executed at (UTC)</dt><dd><time dateTime={item.executed_at}>{time(item.executed_at)}</time></dd>
              <dt>Imported at (UTC)</dt><dd><time dateTime={item.imported_at}>{time(item.imported_at)}</time></dd>
              <dt>Definition fingerprint</dt><dd><code>{item.definition_fingerprint}</code></dd>
            </dl>
          </article>
        ))}
        {history?.next_offset != null && <button type="button" className={action} disabled={busy}
          onClick={() => void load(history.next_offset!)}>Load older results</button>}
        {scriptPath ? (
          <form onSubmit={submit} className="space-y-2">
            <label htmlFor={label + "-json"} className="block font-semibold">Normalized result JSON</label>
            <textarea id={label + "-json"} value={payload} onChange={(event) => setPayload(event.target.value)}
              maxLength={4096} rows={7} required disabled={busy} spellCheck={false} data-testid="execution-evidence-json"
              className="w-full rounded-md border border-slate-300 p-2 font-mono text-xs" />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={action} disabled={busy || Boolean(payload)} onClick={() => setPayload(JSON.stringify({
                test_case_id: testCaseId, external_run_id: "", external_result_id: "",
                script_path: scriptPath, tested_commit_sha: "", executed_at: "", outcome: "PASS",
              }, null, 2))}>Insert JSON template</button>
              <button type="submit" className={action} disabled={busy || !payload.trim()}>Import external result</button>
            </div>
          </form>
        ) : <p>Associate a script in Test Design to import new results.</p>}
      </>}
    </section>
  );
}
