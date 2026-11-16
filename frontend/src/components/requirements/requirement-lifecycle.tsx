"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Requirement } from "@/lib/requirements";

const targets: Record<Requirement["status"], Requirement["status"][]> = {
  Draft: ["In Review"],
  "In Review": ["Ready", "Draft"],
  Ready: ["Draft"],
};

export function RequirementLifecycle({ requirementId, initialStatus }: {
  requirementId: string; initialStatus: Requirement["status"];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const router = useRouter();

  async function transition(target: Requirement["status"]) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/requirements/" + encodeURIComponent(requirementId) + "/transitions",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }) }
      );
      const data = await response.json();
      if (!response.ok || data.id?.toLowerCase() !== requirementId.toLowerCase() || data.status !== target) {
        setError(data.error || "Unable to confirm transition. Refresh the page.");
        return;
      }
      setStatus(target);
      router.refresh();
    } catch {
      setError("The outcome is unknown. Refresh before retrying.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section aria-label="Requirement lifecycle" className="rounded-md border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">Lifecycle status</p>
      <p data-testid="requirement-detail-status" className="mt-2 font-semibold">{status}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets[status].map(target => (
          <button key={target} type="button" disabled={busy}
            data-testid={"transition-to-" + target.toLowerCase().replaceAll(" ", "-")}
            onClick={() => void transition(target)}
            className="rounded-md bg-sky-700 px-3 py-2 text-sm text-white disabled:opacity-50">
            {busy ? "Updating…" : "Move to " + target}
          </button>
        ))}
      </div>
      {error && <p data-testid="requirement-lifecycle-error" role="alert"
        className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-slate-500">Ready is not formal release approval.</p>
    </section>
  );
}
