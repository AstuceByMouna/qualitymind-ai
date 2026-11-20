"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DecisionChallenger } from "./decision-challenger";

type Release = { id: string; name: string; version: string; created_at: string };
type Requirement = { id: string; title: string; archived_at: string | null };
type Obligation = { id: string; title: string; critical: boolean; evidence_status: "PASS" | "FAIL" | "MISSING" | "STALE" };
type Readiness = { state: "NO_GO" | "UNDETERMINED" | "REVIEW_REQUIRED"; explanation: string; obligations: Obligation[] };

async function api<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/governance/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(message.error ?? "The request could not be completed.");
  }
  return response.json() as Promise<T>;
}

export function GovernanceWorkbench() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selected, setSelected] = useState<Release | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [obligationTitle, setObligationTitle] = useState("");
  const [critical, setCritical] = useState(true);
  const [evidenceRef, setEvidenceRef] = useState("");
  const [testedVersion, setTestedVersion] = useState("");
  const [evidenceResult, setEvidenceResult] = useState<"PASS" | "FAIL">("PASS");
  const [evidenceObligationId, setEvidenceObligationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (release: Release | null) => {
    const list = await api<Release[]>("releases");
    setReleases(list);
    if (release) setReadiness(await api<Readiness>(`releases/${release.id}/readiness`));
    else setReadiness(null);
  }, []);

  useEffect(() => {
    Promise.all([api<Release[]>("releases"), api<{ items: Requirement[] }>("requirements")])
      .then(([list, requirementsResponse]) => {
        setReleases(list);
        setRequirements(requirementsResponse.items.filter((item) => !item.archived_at));
      })
      .catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Unable to load governance data."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "The operation failed."); }
    finally { setBusy(false); }
  }

  function createRelease(event: FormEvent) {
    event.preventDefault();
    void submit(async () => {
      const created = await api<Release>("releases", { name, version });
      setName(""); setVersion(""); setSelected(created); setTestedVersion(created.version);
      await refresh(created);
    });
  }

  function addObligation(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void submit(async () => {
      await api(`releases/${selected.id}/obligations`, { requirement_id: requirementId, title: obligationTitle, critical });
      setObligationTitle(""); setRequirementId(""); await refresh(selected);
    });
  }

  function addEvidence(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void submit(async () => {
      await api(`releases/${selected.id}/obligations/${evidenceObligationId}/evidence`, {
        reference: evidenceRef, tested_version: testedVersion, result: evidenceResult,
      });
      setEvidenceRef(""); setEvidenceObligationId(""); await refresh(selected);
    });
  }

  return (
    <div className="space-y-6" data-testid="governance-workbench">
      <div>
        <h2 className="text-2xl font-semibold">Release Readiness</h2>
        <p className="mt-2 text-sm text-slate-600">Record obligations and version-specific evidence. This prototype cannot authorize a GO; human approval and access controls are not implemented.</p>
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Releases</h3>
          <form onSubmit={createRelease} className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-medium">Release name
              <input data-testid="release-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="November release" />
            </label>
            <label className="text-sm font-medium">Version
              <input data-testid="release-version" required maxLength={80} value={version} onChange={(e) => setVersion(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="1.2.0" />
            </label>
            <button data-testid="create-release" disabled={busy} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Create release</button>
          </form>
          <div className="mt-5 space-y-2" aria-label="Release list">
            {loading && <p className="text-sm text-slate-500">Loading releases...</p>}
            {!loading && releases.length === 0 && <p className="text-sm text-slate-500">No release has been recorded yet.</p>}
            {releases.map((release) => (
              <button key={release.id} type="button" onClick={() => {
                setSelected(release); setTestedVersion(release.version); setError(""); setReadiness(null);
                void api<Readiness>(`releases/${release.id}/readiness`).then(setReadiness).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Unable to load release."));
              }} className={`block w-full rounded-lg border p-3 text-left text-sm ${selected?.id === release.id ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="font-medium">{release.name}</span> · {release.version}
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Readiness result">
          <h3 className="text-lg font-semibold">Decision assessment</h3>
          {!selected && <p className="mt-3 text-sm text-slate-500">Select a release to inspect its evidence.</p>}
          {selected && !readiness && <p className="mt-3 text-sm text-slate-500">Loading assessment...</p>}
          {selected && readiness && <div className="mt-4 space-y-3" data-testid="release-readiness">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${readiness.state === "NO_GO" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{readiness.state.replaceAll("_", " ")}</span>
            <p className="text-sm text-slate-600">{readiness.explanation}</p>
            <ul className="space-y-2">{readiness.obligations.map((obligation) => (
              <li key={obligation.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <span className="font-medium">{obligation.title}</span>
                <span className="ml-2 text-xs text-slate-600">({obligation.critical ? "critical" : "non-critical"})</span>
                <span className="block pt-1 text-xs font-semibold">Evidence: {obligation.evidence_status}</span>
              </li>
            ))}</ul>
          </div>}
        </section>
      </div>
      {selected && <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Add an obligation</h3>
          <form onSubmit={addObligation} className="mt-4 space-y-3">
            <label className="block text-sm font-medium">Related requirement
              <select required value={requirementId} onChange={(e) => setRequirementId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2">
                <option value="">Choose requirement</option>
                {requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Obligation
              <input required maxLength={255} value={obligationTitle} onChange={(e) => setObligationTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="Protect confidential information" />
            </label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} /> Critical obligation</label>
            <button disabled={busy || requirements.length === 0} className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50">Save obligation</button>
            {requirements.length === 0 && <p className="text-xs text-slate-500">Add an active requirement in Requirements Intelligence first.</p>}
          </form>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Record evidence</h3>
          <form onSubmit={addEvidence} className="mt-4 space-y-3">
            <label className="block text-sm font-medium">Obligation
              <select required value={evidenceObligationId} onChange={(e) => setEvidenceObligationId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2">
                <option value="">Choose obligation</option>
                {readiness?.obligations.map((obligation) => <option key={obligation.id} value={obligation.id}>{obligation.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Evidence reference
              <input required maxLength={500} value={evidenceRef} onChange={(e) => setEvidenceRef(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="test-run-123" />
            </label>
            <label className="block text-sm font-medium">Tested software version
              <input required maxLength={80} value={testedVersion} onChange={(e) => setTestedVersion(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="block text-sm font-medium">Result
              <select value={evidenceResult} onChange={(e) => setEvidenceResult(e.target.value as "PASS" | "FAIL")} className="mt-1 w-full rounded-md border border-slate-300 p-2">
                <option value="PASS">PASS</option><option value="FAIL">FAIL</option>
              </select>
            </label>
            <button disabled={busy || !readiness?.obligations.length} className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50">Save evidence</button>
          </form>
        </section>
      </div>}
      {selected && readiness && <DecisionChallenger key={selected.id} releaseId={selected.id} version={selected.version} obligations={readiness.obligations} />}
      <p className="text-xs text-slate-500">Prototype DC-01 — evidence is manually recorded and not independently verified. No authentication, decision signing or release authorization is available.</p>
    </div>
  );
}
