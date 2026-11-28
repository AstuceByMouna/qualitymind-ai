"use client";

import Link from "next/link";
import { ExecutionEvidencePanel } from "@/components/requirements/execution-evidence-panel";
import { useEffect, useState } from "react";
import type { AcceptanceCriterion, Requirement } from "@/lib/requirements";

type Case = {
  test_case_id: string;
  title: string;
  status: "DRAFT";
  criterion_id: string | null;
  criterion_link: "LINKED" | "MISSING" | "INCONSISTENT";
  playwright_script_path: string | null;
  execution_status: "NOT_EXECUTED";
};

type Traceability = {
  requirement: Pick<Requirement, "id" | "title" | "status">;
  criteria: AcceptanceCriterion[];
  test_cases: Case[];
};

type State = { data: Traceability } | { error: string } | null;

const panel = "space-y-3 rounded-xl border border-slate-200 bg-white p-5";
const link = "font-medium text-sky-700 underline underline-offset-2 focus-visible:outline-2";
const identifier = "break-all font-mono text-xs text-slate-600";

export function TraceabilityView({ requirementId }: { requirementId: string }) {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(
          "/api/requirements/" + encodeURIComponent(requirementId) + "/traceability",
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) {
          const messages: Record<number, string> = {
            400: "Invalid requirement identifier.",
            404: "Requirement not found.",
            409: "This requirement is archived. Traceability is available for active requirements.",
          };
          setState({ error: messages[response.status] ?? "Unable to load traceability. Refresh the page to retry." });
          return;
        }
        const data: Traceability = await response.json();
        setState({ data });
      } catch {
        if (!controller.signal.aborted) {
          setState({ error: "Unable to load traceability. Refresh the page to retry." });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [requirementId]);

  useEffect(() => {
    if (!state || !("data" in state)) return;
    // A saved test may link directly here before the asynchronous result is visible.
    const target = document.getElementById(window.location.hash.slice(1));
    target?.focus();
  }, [state]);

  if (!state) return <p role="status" data-testid="traceability-loading">Loading traceability…</p>;
  if ("error" in state) return <p role="alert" className={panel}>{state.error}</p>;

  const { requirement, criteria, test_cases: cases } = state.data;
  const casesByCriterion = new Map<string, Case[]>();
  for (const item of cases) {
    if (item.criterion_link !== "LINKED" || item.criterion_id === null) continue;
    const linked = casesByCriterion.get(item.criterion_id) ?? [];
    linked.push(item);
    casesByCriterion.set(item.criterion_id, linked);
  }
  const sourceHref = "/requirements/" + encodeURIComponent(requirement.id);

  return (
    <div className="space-y-6" data-testid="traceability-view">
      <section className={panel} id="trace-requirement" tabIndex={-1}>
        <h2 className="text-lg font-semibold">
          <Link href={sourceHref} prefetch={false} className={link}>{requirement.title}</Link>
        </h2>
        <p className={identifier}>Requirement ID {requirement.id}</p>
        <p className="text-sm">Status <strong>{requirement.status}</strong></p>
      </section>

      <section aria-labelledby="trace-criteria" className="space-y-3">
        <h2 id="trace-criteria" className="text-lg font-semibold">Acceptance criteria</h2>
        {criteria.length === 0 && <p className={panel}>No acceptance criteria.</p>}
        {criteria.map((criterion) => (
          <article key={criterion.id} id={"criterion-" + criterion.id} tabIndex={-1}
            data-testid="traceability-criterion" className={panel}>
            <h3 className="text-sm font-semibold">Criterion {criterion.position}</h3>
            <p className="break-words text-sm">{criterion.content}</p>
            <p className={identifier}>Criterion ID {criterion.id}</p>
            <ul className="space-y-1 text-sm">
              {casesByCriterion.get(criterion.id)?.map((item) => (
                <li key={item.test_case_id}>
                  <a className={link} href={"#test-" + item.test_case_id}>{item.title}</a>
                </li>
              )) ?? <li>No linked test cases.</li>}
            </ul>
          </article>
        ))}
      </section>

      <section aria-labelledby="trace-cases" className="space-y-3">
        <h2 id="trace-cases" className="text-lg font-semibold">Test cases</h2>
        <p className="text-sm text-slate-600">Drafts and script associations do not establish approved coverage or execution evidence.</p>
        {cases.length === 0 && <p className={panel}>No associated test cases.</p>}
        {cases.map((item) => (
          <article key={item.test_case_id} id={"test-" + item.test_case_id} tabIndex={-1}
            data-testid="traceability-test" className={panel}>
            <h3 className="break-words font-semibold">{item.title}</h3>
            <p className={identifier}>Test case ID {item.test_case_id}</p>
            <p className="text-sm">Status <strong>{item.status}</strong></p>
            <p className="text-sm"><a className={link} href="#trace-requirement">Source requirement</a></p>
            {item.criterion_link === "LINKED" && (
              <p className="text-sm">
                <a className={link} href={"#criterion-" + item.criterion_id}>Source criterion</a>{" "}
                <span className={identifier}>{item.criterion_id}</span>
              </p>
            )}
            {item.criterion_link === "MISSING" && <p className="text-sm">Source criterion missing.</p>}
            {item.criterion_link === "INCONSISTENT" && (
              <p className="text-sm">Source criterion unavailable for this requirement.{" "}
                <span className={identifier}>{item.criterion_id}</span>
              </p>
            )}
            {item.playwright_script_path ? (
              <p className="text-sm">Associated script{" "}
                <code className={identifier}>{item.playwright_script_path}</code>
              </p>
            ) : <p className="text-sm">No script association.</p>}
            <p className="text-sm">QualityMind execution <strong>{item.execution_status}</strong></p>
            <ExecutionEvidencePanel testCaseId={item.test_case_id} scriptPath={item.playwright_script_path} />
          </article>
        ))}
      </section>
    </div>
  );
}
