"use client";

import { useEffect, useState } from "react";

type Association = {
  test_case_id: string;
  playwright_script_path: string | null;
  execution_status: "NOT_EXECUTED";
};

export function PlaywrightAssociation({ testCaseId }: { testCaseId: string }) {
  const [path, setPath] = useState("");
  const [original, setOriginal] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const endpoint = "/api/automation/test-cases/" + encodeURIComponent(testCaseId) + "/automation";

  useEffect(() => {
    let active = true;
    void fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load script association");
        return response.json() as Promise<Association>;
      })
      .then((data) => {
        if (active) {
          setPath(data.playwright_script_path ?? "");
          setOriginal(data.playwright_script_path);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Association unavailable");
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [endpoint]);

  async function save() {
    if (busy || !path.trim() || path === original) return;
    setBusy(true);
    setInfo("");
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playwright_script_path: path }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = data && typeof data === "object" && "detail" in data ? JSON.stringify(data.detail) :
          data && typeof data === "object" && "error" in data ? String(data.error) : "Save failed";
        throw new Error(detail);
      }
      const association = data as Association;
      setPath(association.playwright_script_path ?? "");
      setOriginal(association.playwright_script_path);
      setInfo("Playwright reference saved (not executed).");
    } catch (err) {
      setError((err instanceof Error ? err.message : "Save not confirmed") +
        ". Reload the page before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="playwright-association" className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label htmlFor={"automation-" + testCaseId} className="block text-xs font-semibold">
        Playwright script (repository-relative path)
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input id={"automation-" + testCaseId} data-testid="playwright-script-path"
          value={path} onChange={(event) => setPath(event.target.value)}
          disabled={busy} maxLength={300}
          placeholder="frontend/tests/e2e/example.spec.ts"
          className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm" />
        <button type="button" data-testid="playwright-save" onClick={() => void save()}
          disabled={busy || !path.trim() || path === original}
          className="rounded bg-sky-700 px-3 py-2 text-sm text-white disabled:bg-slate-400">
          Save reference
        </button>
      </div>
      <p className="text-xs text-slate-600">Execution: NOT_EXECUTED. A reference is not proof of test coverage.</p>
      {original && <p data-testid="playwright-persisted" className="break-all text-xs">Saved reference: {original}</p>}
      {info && <p role="status" className="text-xs text-sky-700">{info}</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
