"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Level = "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH";
type RiskRow = {
  id: string;
  title: string;
  risk_level: Level;
  draft_count: number;
  test_design_status: "NO_DRAFT" | "DRAFT_ONLY";
  needs_test_design: boolean;
};

const riskOptions: Level[] = ["UNKNOWN", "LOW", "MEDIUM", "HIGH"];

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const value: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = value && typeof value === "object" && "detail" in value
      ? String(value.detail) : "Request failed";
    throw new Error(detail);
  }
  return value as T;
}

export function RiskWorkbench() {
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [showCritical, setShowCritical] = useState(false);

  useEffect(() => {
    void request<{ items: RiskRow[]; total: number }>("/api/risk/requirements")
      .then((r) => { setRows(r.items); setTotal(r.total); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load risks."))
      .finally(() => setLoading(false));
  }, []);

  async function changeRisk(id: string, risk_level: Level) {
    if (saving !== null) return;
    setSaving(id);
    setError("");
    setInfo("");
    try {
      await request<RiskRow>("/api/risk/requirements/" + encodeURIComponent(id) + "/risk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risk_level }),
      });
      const result = await request<{ items: RiskRow[]; total: number }>("/api/risk/requirements");
      setRows(result.items);
      setTotal(result.total);
      setInfo("Risk assessment saved.");
    } catch (err) {
      setError((err instanceof Error ? err.message : "Save not confirmed.") +
        " Reload the assessment before retrying.");
    } finally {
      setSaving(null);
    }
  }

  const visible = showCritical ? rows.filter((r) => r.risk_level === "HIGH") : rows;
  return (
    <div data-testid="risk-workbench" className="space-y-5">
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Human-assessed risk only.</strong> UNKNOWN means not evaluated (not LOW).
        Stored test cases are DRAFT_ONLY and do not prove approved or executed test coverage.
        No automatic AI classification is performed.
      </section>
      {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {info && <p role="status" className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">{info}</p>}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Requirements by risk ({total})</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showCritical} onChange={(e) => setShowCritical(e.target.checked)}
              data-testid="risk-high-filter" />
            HIGH only
          </label>
        </div>
        {loading && <p role="status" className="mt-4 text-sm text-slate-500">Loading risk assessments…</p>}
        {!loading && rows.length === 0 && !error && <p className="mt-4 text-sm">No active requirements found.</p>}
        {!loading && rows.length < total && <p className="mt-4 text-sm text-amber-800">
          Showing {rows.length} of {total} requirements. Assessment list is limited to 200 items per page.
        </p>}
        {!loading && visible.length === 0 && rows.length > 0 && <p className="mt-4 text-sm">No matching requirements.</p>}
        <div className="mt-5 space-y-3">
          {visible.map((item) => (
            <article key={item.id} data-testid="risk-row" className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={"/requirements/" + encodeURIComponent(item.id)} className="break-words font-semibold text-sky-700 underline-offset-4 hover:underline">{item.title}</Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.test_design_status === "NO_DRAFT" ? "NO_DRAFT — no saved test case" :
                      "DRAFT_ONLY — review required, not approved or executed"}
                    {" · "}{item.draft_count} saved draft(s)
                  </p>
                </div>
                <label className="text-sm font-semibold">
                  Risk
                  <select data-testid="risk-level" aria-label={"Risk for " + item.title}
                    disabled={saving !== null} value={item.risk_level}
                    onChange={(e) => void changeRisk(item.id, e.target.value as Level)}
                    className="ml-2 rounded-md border border-slate-300 bg-white p-2 text-sm">
                    {riskOptions.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </label>
              </div>
              {item.needs_test_design && <p className="mt-2 font-medium text-amber-800">
                HIGH + NO_DRAFT — test design priority. Not a release coverage verdict.
              </p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
