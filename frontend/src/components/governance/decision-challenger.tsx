"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Obligation = { id: string; title: string };
type ChallengeStatus = "OPEN_UNQUALIFIED" | "QUALIFIED" | "RESOLVED" | "REJECTED";
type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Challenge = {
  id: string; version: string; source: string; owner: string; reason: string;
  obligation_id: string; severity: Severity; status: ChallengeStatus;
  plausible_harm: string | null; required_evidence: string | null;
};
type Assessment = {
  dc01_state: string; state: string; explanation: string;
  qualifying_critical_challenge_ids: string[]; challenges_total: number;
  qualified_open: number;
};
type Event = {
  id: string; from_status: string | null; to_status: string;
  actor: string; justification: string; created_at: string;
};

async function request<T>(path: string, body?: unknown): Promise<T> {
  const result = await fetch(`/api/governance/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!result.ok) {
    const data = await result.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? "This Challenger operation could not be completed.");
  }
  return result.json() as Promise<T>;
}

export function DecisionChallenger({
  releaseId, version, obligations, baselineState,
}: { releaseId: string; version: string; obligations: Obligation[]; baselineState: string }) {
  const [items, setItems] = useState<Challenge[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [history, setHistory] = useState<Event[]>([]);
  const [obligationId, setObligationId] = useState("");
  const [source, setSource] = useState("Manual UAT");
  const [owner, setOwner] = useState("QA reviewer (unverified)");
  const [actor, setActor] = useState("QA reviewer (unverified)");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<Severity>("HIGH");
  const [plausibleHarm, setPlausibleHarm] = useState("");
  const [requiredEvidence, setRequiredEvidence] = useState("");
  const [justification, setJustification] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const prefix = `releases/${releaseId}/challenges`;
  const reload = useCallback(async () => {
    const [list, summary] = await Promise.all([
      request<Challenge[]>(prefix),
      request<Assessment>(`${prefix}/assessment`),
    ]);
    setItems(list);
    setAssessment(summary);
  }, [prefix]);

  useEffect(() => {
    let live = true;
    Promise.all([request<Challenge[]>(prefix), request<Assessment>(`${prefix}/assessment`)])
      .then(([list, summary]) => {
        if (live) { setItems(list); setAssessment(summary); setError(""); }
      }).catch((problem: unknown) => {
        if (live) setError(problem instanceof Error ? problem.message : "Could not load objections.");
      });
    return () => { live = false; };
  }, [prefix, baselineState]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function perform(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await operation(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Operation failed."); }
    finally { setBusy(false); }
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void perform(async () => {
      const created = await request<Challenge>(prefix, {
        obligation_id: obligationId, version, source, owner, reason,
        severity, plausible_harm: plausibleHarm.trim() || null,
        required_evidence: requiredEvidence.trim() || null,
      });
      setReason(""); setObligationId(""); setSelectedId(created.id);
      setHistory([]); setNotice("Objection recorded as OPEN_UNQUALIFIED; not automatically blocking.");
      await reload();
    });
  }

  function changeStatus(to_status: "QUALIFIED" | "RESOLVED" | "REJECTED") {
    if (!selected) return;
    void perform(async () => {
      await request(`${prefix}/${selected.id}/transitions`, {
        to_status, actor, justification,
        plausible_harm: plausibleHarm.trim() || null,
        required_evidence: requiredEvidence.trim() || null,
      });
      await reload();
      setHistory(await request<Event[]>(`${prefix}/${selected.id}/history`));
      setNotice("Transition saved. Assessment recalculated; no GO is issued.");
      setJustification("");
    });
  }

  function inspect(item: Challenge) {
    setSelectedId(item.id);
    setPlausibleHarm(item.plausible_harm ?? "");
    setRequiredEvidence(item.required_evidence ?? "");
    setHistory([]);
    setError("");
    void request<Event[]>(`${prefix}/${item.id}/history`)
      .then(setHistory)
      .catch((problem: unknown) => setError(problem instanceof Error ? problem.message : "History unavailable."));
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="decision-challenger">
      <h3 className="text-lg font-semibold">Decision Challenger</h3>
      <p className="mt-2 text-sm text-slate-600">
        Capture review objections linked to this release. Policy P0 is provisional. Actor names and evidence are not verified; no release GO is possible.
      </p>
      {error && <p role="alert" className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-md bg-sky-50 p-3 text-sm text-sky-800">{notice}</p>}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4" data-testid="challenger-assessment">
        <p className="text-sm font-semibold">Combined release assessment (draft)</p>
        {assessment ? (
          <div className="mt-2 text-sm">
            <p>DC-01 baseline: <strong>{assessment.dc01_state}</strong></p>
            <p>With objections: <strong>{assessment.state}</strong></p>
            <p>{assessment.explanation}</p>
            <p className="mt-1 text-xs text-slate-600">
              {assessment.challenges_total} objections; {assessment.qualified_open} qualified/open; {assessment.qualifying_critical_challenge_ids.length} critical blockers.
            </p>
          </div>
        ) : <p className="text-sm text-slate-500">Loading evaluation...</p>}
      </div>
      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <form onSubmit={create} className="space-y-3">
          <h4 className="font-semibold">Register objection</h4>
          <label className="block text-sm font-medium">Related release obligation
            <select data-testid="challenge-obligation" required value={obligationId}
              onChange={(e) => setObligationId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2">
              <option value="">Choose obligation</option>
              {obligations.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Source
            <input required maxLength={120} value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <label className="block text-sm font-medium">Owner (not authenticated)
            <input required maxLength={120} value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <label className="block text-sm font-medium">Objection and reason
            <textarea data-testid="challenge-reason" required maxLength={500} rows={2} value={reason}
              onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <label className="block text-sm font-medium">Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <button data-testid="create-challenge" disabled={busy || obligations.length === 0}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50">Register objection</button>
          {obligations.length === 0 && <p className="text-xs text-slate-500">Add a release obligation first.</p>}
        </form>
        <div>
          <h4 className="font-semibold">Objection register</h4>
          {items.length === 0 && <p className="mt-3 text-sm text-slate-500">No objections recorded.</p>}
          <ul className="mt-3 space-y-2" data-testid="challenge-list">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => inspect(item)}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${selectedId === item.id ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <span className="block font-medium">{item.reason}</span>
                  <span className="mt-1 block text-xs text-slate-600">{item.severity} · {item.status} · {item.version}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-4" data-testid="challenge-review">
            <p className="font-semibold">Review selected objection</p>
            <p className="text-sm">Status: <strong>{selected.status}</strong></p>
            <label className="block text-sm font-medium">Plausible harm
              <textarea maxLength={500} rows={2} value={plausibleHarm} onChange={(e) => setPlausibleHarm(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Required evidence
              <textarea maxLength={500} rows={2} value={requiredEvidence} onChange={(e) => setRequiredEvidence(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Reviewer (not authenticated)
              <input required maxLength={120} value={actor} onChange={(e) => setActor(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Decision justification
              <textarea required maxLength={500} rows={2} value={justification} onChange={(e) => setJustification(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              {selected.status === "OPEN_UNQUALIFIED" && <button type="button" data-testid="qualify-challenge"
                disabled={busy || !actor.trim() || !justification.trim() || !plausibleHarm.trim() || !requiredEvidence.trim()}
                onClick={() => changeStatus("QUALIFIED")}
                className="rounded-md bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50">Qualify</button>}
              {selected.status === "QUALIFIED" && <button type="button" disabled={busy || !actor.trim() || !justification.trim()}
                onClick={() => changeStatus("RESOLVED")}
                className="rounded-md bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50">Resolve</button>}
              {(["OPEN_UNQUALIFIED", "QUALIFIED"] as ChallengeStatus[]).includes(selected.status) &&
                <button type="button" disabled={busy || !actor.trim() || !justification.trim()}
                  onClick={() => changeStatus("REJECTED")}
                  className="rounded-md border border-slate-400 px-3 py-2 text-xs disabled:opacity-50">Reject with reason</button>}
            </div>
            <h5 className="text-sm font-semibold">Recorded history (API-level)</h5>
            <ol className="space-y-2 text-xs" data-testid="challenge-history">
              {history.map((item) => <li key={item.id} className="rounded border border-slate-100 p-2">
                {item.from_status ?? "NEW"} → <strong>{item.to_status}</strong>; {item.actor}: {item.justification}
              </li>)}
            </ol>
          </div>}
        </div>
      </div>
      <p className="mt-4 text-xs text-amber-800">
        Prototype only: manual assertions and unauthenticated reviewers are not attestations. Never use this assessment to authorize a real deployment.
      </p>
    </section>
  );
}
