"use client";

import Link from "next/link";
import { PlaywrightAssociation } from "./playwright-association";
import { useEffect, useRef, useState } from "react";

type Requirement = { id: string; title: string; archived_at: string | null };
type Suggestion = {
  criterion_id: string;
  source_criterion: string;
  kind: "POSITIVE" | "NEGATIVE";
  title: string;
  preconditions: string;
  steps: string;
  expected_result: string;
  requires_rule_clarification: boolean;
};
type TestCase = Omit<Suggestion, "criterion_id"> & {
  criterion_id: string | null;
  id: string;
  requirement_id: string;
  status: "DRAFT";
  generator_version: string;
  created_at: string;
};

const prefix = "/api/test-design/requirements";

async function read<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store" });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = result && typeof result === "object" && "detail" in result
      ? String(result.detail) : result && typeof result === "object" && "error" in result
        ? String(result.error) : "The request could not be completed.";
    throw new Error(message);
  }
  return result as T;
}

export function TestDesignWorkbench() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selected, setSelected] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [saved, setSaved] = useState<TestCase[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const selectedRef = useRef("");
  const activeRequirement = requirements.find((item) => item.id === selected);
  // Never show drafts for an absent/archived requirement whose option cannot be selected.
  const visibleSelection = activeRequirement ? selected : "";

  useEffect(() => {
    void read<{ items: Requirement[] }>("/api/test-design/requirements")
      .then((result) => setRequirements(result.items.filter((item) => !item.archived_at)))
      .catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Unable to load requirements."))
      .finally(() => setLoading(false));
  }, []);

  async function choose(requirementId: string) {
    selectedRef.current = requirementId;
    setSelected(requirementId);
    setSuggestions([]);
    setSaved([]);
    setError("");
    setInfo("");
    if (!requirementId) return;
    setBusy(true);
    try {
      const base = prefix + "/" + encodeURIComponent(requirementId) + "/test-cases";
      const [proposals, cases] = await Promise.all([
        read<Suggestion[]>(base + "/suggestions"),
        read<TestCase[]>(base),
      ]);
      if (selectedRef.current === requirementId) {
        setSuggestions(proposals);
        setSaved(cases);
      }
    } catch (issue) {
      if (selectedRef.current === requirementId) setError(issue instanceof Error ? issue.message : "Unable to load cases.");
    } finally {
      if (selectedRef.current === requirementId) setBusy(false);
    }
  }

  async function save(proposal: Suggestion) {
    if (busy || !visibleSelection) return;
    const requirementId = visibleSelection;
    setBusy(true);
    setError("");
    setInfo("");
    const base = prefix + "/" + encodeURIComponent(requirementId) + "/test-cases";
    try {
      await read<TestCase>(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criterion_id: proposal.criterion_id, kind: proposal.kind }),
      });
      const cases = await read<TestCase[]>(base);
      if (selectedRef.current === requirementId) {
        setSaved(cases);
        setInfo("Draft saved. Review its expected result before use.");
      }
    } catch (issue) {
      if (selectedRef.current === requirementId) {
        setError((issue instanceof Error ? issue.message : "Save not confirmed.") +
          " Reload this requirement before retrying.");
      }
    } finally {
      if (selectedRef.current === requirementId) setBusy(false);
    }
  }

  return (
    <div data-testid="test-design-workbench" className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Human-review drafts only.</strong> Suggestions are deterministic and do not use OpenAI.
        Negative cases require clarification of the expected validation rule. No test is approved or executed.
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {info && <p role="status" className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">{info}</p>}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <label htmlFor="design-requirement" className="block text-sm font-semibold">Choose an active requirement</label>
        <select id="design-requirement" data-testid="test-design-requirement"
          value={visibleSelection} onChange={(event) => void choose(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 p-3 text-sm">
          <option value="">Select requirement</option>
          {requirements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        {loading && <p role="status" className="mt-3 text-sm text-slate-500">Loading requirements…</p>}
        {!loading && requirements.length === 0 && <p className="mt-3 text-sm text-slate-600">No active requirements available.</p>}
        {activeRequirement && <p className="mt-3 text-sm font-medium text-slate-700" data-testid="test-design-selected-label">
          Selected requirement: {activeRequirement.title}
        </p>}
        {visibleSelection && <Link className="mt-3 inline-block text-sm text-sky-700 underline"
          href={"/requirements/" + encodeURIComponent(visibleSelection)}>View source requirement and acceptance criteria</Link>}
      </section>
      {visibleSelection && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4" aria-label="Suggestions">
            <h2 className="text-lg font-semibold">Suggested cases ({suggestions.length})</h2>
            {!busy && suggestions.length === 0 && <p className="rounded-xl border bg-white p-4 text-sm">
              No acceptance criteria found. Add criteria to the requirement first.
            </p>}
            {suggestions.map((item) => {
              const alreadySaved = saved.some((s) => s.criterion_id === item.criterion_id && s.kind === item.kind);
              return <article key={item.criterion_id + item.kind} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">{item.kind}</span>
                </div>
                <p className="break-words text-xs text-slate-600"><strong>Source:</strong> {item.source_criterion}</p>
                <dl className="space-y-2 text-sm">
                  <div><dt className="font-semibold">Preconditions</dt><dd className="whitespace-pre-wrap">{item.preconditions}</dd></div>
                  <div><dt className="font-semibold">Steps</dt><dd className="whitespace-pre-wrap">{item.steps}</dd></div>
                  <div><dt className="font-semibold">Expected result</dt><dd className="whitespace-pre-wrap">{item.expected_result}</dd></div>
                </dl>
                {item.requires_rule_clarification && <p className="text-sm font-medium text-amber-800">
                  Expected behavior is not specified. Obtain human clarification before executing.
                </p>}
                <button type="button" data-testid="test-design-save"
                  disabled={busy || alreadySaved} onClick={() => void save(item)}
                  className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400">
                  {alreadySaved ? "Saved as draft" : "Save draft"}
                </button>
              </article>;
            })}
          </section>
          <section aria-label="Saved drafts" className="space-y-4">
            <h2 className="text-lg font-semibold">Saved drafts ({saved.length})</h2>
            {saved.length === 0 && <p className="rounded-xl border bg-white p-4 text-sm">No drafts saved for this requirement.</p>}
            {saved.map((item) => <article key={item.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{item.title}</h3>
                <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">DRAFT</span>
              </div>
              <p className="text-xs text-slate-600">Type: {item.kind} · Source criterion: {item.criterion_id ?? "deleted (snapshot retained)"}</p>
              <p><strong>Expected result:</strong> {item.expected_result}</p>
              {item.requires_rule_clarification && <p className="font-medium text-amber-800">Rule clarification required</p>}
              <PlaywrightAssociation testCaseId={item.id} />
            </article>)}
          </section>
        </div>
      )}
    </div>
  );
}
