"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveRequirement({ requirementId, archived }: {requirementId: string; archived: boolean}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isArchived, setIsArchived] = useState(archived);
  // Keep server-provided state authoritative after navigation or refresh.
  useEffect(() => { setIsArchived(archived); }, [archived]);
  const locked = useRef(false);
  const router = useRouter();
  async function act() {
    if (locked.current) return;
    if (!isArchived && !window.confirm("Archive this requirement? It can be restored later. No data will be deleted.")) return;
    locked.current = true;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/requirements/" + encodeURIComponent(requirementId) + (isArchived ? "/restore" : "/archive"), {method:"POST"});
      const payload = await response.json();
      if (!response.ok || payload.id?.toLowerCase() !== requirementId.toLowerCase() || Boolean(payload.archived_at) === isArchived) {
        setError("The operation could not be verified. Refresh before trying again.");
        return;
      }
      // Reflect a verified server response immediately; refresh the rest of
      // the server-rendered details without making this button depend on its timing.
      setIsArchived(Boolean(payload.archived_at));
      router.refresh();
    } catch {
      setError("Network outcome unknown. Refresh before retrying.");
    } finally {locked.current = false; setBusy(false);}
  }
  return <section aria-label="Archive management" className="rounded-md border p-4">
    <p className="mb-2 text-sm">{isArchived ? "Archived requirement. Data and history are retained." : "Archive without deleting data or history."}</p>
    <button type="button" disabled={busy} onClick={() => void act()} data-testid="requirement-archive-action"
      className="rounded-md border border-slate-400 px-3 py-2 text-sm disabled:opacity-50">
      {busy ? "Updating..." : isArchived ? "Restore requirement" : "Archive requirement"}
    </button>
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
  </section>;
}
