"use client";

import { useState } from "react";

type Result = {
  classification: "TIMEOUT" | "LOCATOR" | "ASSERTION" | "HTTP" | "UNKNOWN";
  indicator: string;
  suggested_next_step: string;
  confidence: "HEURISTIC";
  review_required: true;
  execution_status: "NOT_EXECUTED";
};

export function FailureWorkbench() {
  const [excerpt, setExcerpt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function analyze() {
    setResult(null);
    setError("");
    setWorking(true);
    try {
      const response = await fetch("/api/failure-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excerpt }),
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        // Do not surface server diagnostic echoes of user-supplied log content.
        setError(response.status === 422
          ? "Provide a readable excerpt between 10 and 2,000 characters."
          : "Unable to analyze the excerpt. Check the QA API.");
        return;
      }
      setResult(payload as Result);
    } catch {
      setError("Unable to analyze the excerpt. Check the QA API.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div data-testid="failure-workbench" className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Diagnostic aid only.</strong> Paste synthetic or anonymized failure excerpts.
        Never paste secrets, customer data or production logs. Heuristic classification is not
        a confirmed root cause and does not execute a test or approve a release.
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <label htmlFor="failure-excerpt" className="block text-sm font-semibold">Failure excerpt</label>
        <textarea id="failure-excerpt" data-testid="failure-excerpt" rows={7}
          maxLength={2000} value={excerpt}
          onChange={(event) => { setExcerpt(event.target.value); setResult(null); setError(""); }}
          placeholder="Example: TimeoutError: locator.waitFor: Timeout 30000ms exceeded"
          className="mt-2 w-full rounded-md border border-slate-300 p-3 text-sm" />
        <p className="mt-2 text-xs text-slate-500">{excerpt.length}/2000 characters · not stored by QualityMind AI</p>
        <button type="button" data-testid="failure-analyze" disabled={working || excerpt.trim().length < 10}
          onClick={() => void analyze()}
          className="mt-3 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400">
          {working ? "Analyzing…" : "Analyze excerpt"}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </section>
      {result && (
        <section data-testid="failure-result" aria-label="Failure classification"
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 text-sm">
          <h2 className="text-lg font-semibold">Preliminary classification</h2>
          <p><strong>Category:</strong> <span data-testid="failure-category">{result.classification}</span></p>
          <p><strong>Indicator:</strong> {result.indicator}</p>
          <p><strong>Suggested validation:</strong> {result.suggested_next_step}</p>
          <p><strong>Confidence:</strong> {result.confidence} · Human review required</p>
          <p><strong>Execution:</strong> {result.execution_status}</p>
        </section>
      )}
    </div>
  );
}
