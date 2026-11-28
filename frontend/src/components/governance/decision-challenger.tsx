"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { DecisionSummary } from "./decision-summary";

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
  releaseId, version, obligations, showHistory, beginOperation, endOperation,
}: {
  releaseId: string; version: string; obligations: Obligation[]; showHistory: boolean;
  beginOperation: () => boolean; endOperation: () => void;
}) {
  const [items, setItems] = useState<Challenge[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const currentObjection = useRef("");

  const [history, setHistory] = useState<Event[] | null>(null);
  const [historyError, setHistoryError] = useState("");
  const historyRequest = useRef(0);
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
  }, [prefix]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function perform(operation: () => Promise<void>) {
    if (!beginOperation()) return;
    setAssessment(null);
    setBusy(true); setError(""); setNotice("");
    try { await operation(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Operation failed."); }
    finally {
      setBusy(false);
      endOperation();
    }
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const originalSelection = currentObjection.current;
    void perform(async () => {
      const created = await request<Challenge>(prefix, {
        obligation_id: obligationId, version, source, owner, reason,
        severity, plausible_harm: plausibleHarm.trim() || null,
        required_evidence: requiredEvidence.trim() || null,
      });
      setReason("");
      setObligationId("");
      if (currentObjection.current === originalSelection) inspect(created);
      setNotice("Objection recorded as OPEN_UNQUALIFIED. Review it to decide whether to qualify or reject it.");
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
      if (currentObjection.current === selected.id) setJustification("");
      setNotice("Objection transition saved.");
      await Promise.all([reload(), refreshHistory(selected.id)]);
    });
  }

  async function refreshHistory(id: string) {
    // A write may finish while the user is reading another objection.
    if (currentObjection.current !== id) return;
    const sequence = ++historyRequest.current;
    setHistory(null);
    setHistoryError("");
    try {
      const events = await request<Event[]>(`${prefix}/${id}/history`);
      if (sequence === historyRequest.current && id === currentObjection.current) setHistory(events);
    } catch (problem) {
      if (sequence === historyRequest.current && id === currentObjection.current) {
        setHistoryError(problem instanceof Error ? problem.message : "History unavailable.");
      }
    }
  }

  function inspect(item: Challenge) {
    currentObjection.current = item.id;
    setSelectedId(item.id);
    setPlausibleHarm(item.plausible_harm ?? "");
    setRequiredEvidence(item.required_evidence ?? "");
    setJustification("");
    void refreshHistory(item.id);
  }

  if (showHistory) {
    return (
      <section aria-labelledby="objection-history-title" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 id="objection-history-title" className="text-lg font-semibold">Objection history</h3>
        <label className="block text-sm font-medium">Objection
          <select value={selectedId} onChange={(event) => {
            const item = items.find((candidate) => candidate.id === event.target.value);
            if (item) inspect(item);
          }} className="mt-1 w-full rounded-md border border-slate-400 p-2">
            <option value="" disabled>Select an objection</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.severity} · {item.reason}</option>)}
          </select>
        </label>
        {!selected && <p className="text-sm text-slate-600">{items.length ? "Select an objection to see its recorded actions." : "No objections available."}</p>}
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        {selected && historyError && <p role="alert" className="text-sm text-rose-800">{historyError}</p>}
        {selected && !historyError && !history && <p role="status" className="text-sm">Loading history…</p>}
        {history?.length === 0 && <p className="text-sm text-slate-600">No actions recorded.</p>}
        {history && <ol className="space-y-2 text-sm" data-testid="challenge-history">
          {history.map((item) => <li key={item.id} className="break-words rounded border border-slate-200 p-3">
            <p>{item.from_status ?? "NEW"} → <strong>{item.to_status}</strong></p>
            <p>{item.actor} · <time dateTime={item.created_at}>{item.created_at}</time></p>
            <p>{item.justification}</p>
          </li>)}
        </ol>}
      </section>
    );
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
          <div className="mt-2 space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <DecisionSummary label="DC-01 baseline" state={assessment.dc01_state} />
              <DecisionSummary label="Combined decision" state={assessment.state} explanation={assessment.explanation} />
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h4 className="font-semibold">Active critical objections</h4>
              {assessment.qualifying_critical_challenge_ids.length === 0 ? <p>No critical objection blockers reported.</p> : (
                <ul className="list-disc pl-5">{assessment.qualifying_critical_challenge_ids.map((id) => (
                  <li key={id}>{items.find((item) => item.id === id)?.reason ?? id}</li>
                ))}</ul>
              )}
              <p className="mt-2 text-slate-700">{assessment.challenges_total} objections · {assessment.qualified_open} qualified and open</p>
            </div>
          </div>
        ) : error ? (
          <button type="button" disabled={busy} onClick={() => void perform(reload)}
            className="mt-2 rounded-md border border-slate-400 px-3 py-2 text-sm">Retry assessment</button>
        ) : <p role="status" className="text-sm text-slate-600">Loading evaluation…</p>}
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
          <button data-testid="create-challenge" disabled={busy || !assessment || obligations.length === 0}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50">Register objection</button>
          {obligations.length === 0 && <p className="text-xs text-slate-500">Add a release obligation first.</p>}
        </form>
        <div>
          <h4 className="font-semibold">Objection register</h4>
          {items.length === 0 && <p className="mt-3 text-sm text-slate-500">No objections recorded.</p>}
          <ul className="mt-3 space-y-2" data-testid="challenge-list">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" aria-pressed={selectedId === item.id} disabled={busy} onClick={() => inspect(item)}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${selectedId === item.id ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <span className="block font-medium">{item.reason}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <strong className={`rounded border px-2 py-1 ${item.severity === "CRITICAL" ? "border-rose-300 bg-rose-100 text-rose-950" : item.severity === "HIGH" ? "border-amber-300 bg-amber-100 text-amber-950" : "border-slate-300 bg-slate-100 text-slate-900"}`}>{item.severity}</strong>
                    <span>{item.status} · {item.version}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selected && <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-4" data-testid="challenge-review">
            <p className="font-semibold">Review selected objection</p>
            <p className="text-sm">{selected.severity} · {selected.reason}</p>
            <p className="text-sm text-slate-600">To qualify, describe the impact and the evidence needed. To resolve or reject, record why.</p>
            <p className="text-sm">Status: <strong>{selected.status}</strong></p>
            <label className="block text-sm font-medium">Plausible harm
              <textarea maxLength={500} rows={2} placeholder="Example: an interrupted checkout could prevent completion" value={plausibleHarm} onChange={(e) => setPlausibleHarm(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Required evidence
              <textarea maxLength={500} rows={2} placeholder="Example: a dated QA replay showing completed checkout" value={requiredEvidence} onChange={(e) => setRequiredEvidence(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Reviewer (not authenticated)
              <input required maxLength={120} value={actor} onChange={(e) => setActor(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Decision justification
              <textarea required maxLength={500} rows={2} placeholder="Explain the decision using the evidence available" value={justification} onChange={(e) => setJustification(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              {selected.status === "OPEN_UNQUALIFIED" && <button type="button" data-testid="qualify-challenge"
                disabled={busy || !assessment || !actor.trim() || !justification.trim() || !plausibleHarm.trim() || !requiredEvidence.trim()}
                onClick={() => changeStatus("QUALIFIED")}
                className="rounded-md bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50">Qualify</button>}
              {selected.status === "QUALIFIED" && <button type="button" disabled={busy || !assessment || !actor.trim() || !justification.trim()}
                onClick={() => changeStatus("RESOLVED")}
                className="rounded-md bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50">Resolve</button>}
              {(["OPEN_UNQUALIFIED", "QUALIFIED"] as ChallengeStatus[]).includes(selected.status) &&
                <button type="button" disabled={busy || !assessment || !actor.trim() || !justification.trim()}
                  onClick={() => changeStatus("REJECTED")}
                  className="rounded-md border border-slate-400 px-3 py-2 text-xs disabled:opacity-50">Reject with reason</button>}
            </div>

          </div>}
        </div>
      </div>
      <p className="mt-4 text-xs text-amber-800">
        Prototype only: manual assertions and unauthenticated reviewers are not attestations. Never use this assessment to authorize a real deployment.
      </p>
    </section>
  );
}
