"use client";

import { useRef, useState, type FormEvent } from "react";
import type { AcceptanceCriterion } from "@/lib/requirements";

type ApiResult = AcceptanceCriterion & { error?: string };

export function AcceptanceCriteriaEditor({
  requirementId, initialItems,
}: {
  requirementId: string;
  initialItems: AcceptanceCriterion[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newContent, setNewContent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const base = "/api/requirements/" + encodeURIComponent(requirementId) + "/acceptance-criteria";

  function normalized(value: string): string | null {
    const content = value.trim();
    if (!content || content.length > 2000 || content.includes(String.fromCharCode(0))) {
      setError("Enter a criterion containing between 1 and 2,000 characters.");
      return null;
    }
    return content;
  }

  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch {
      setError("The outcome could not be confirmed. Reload this requirement before retrying.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function validatedResult(response: Response): Promise<ApiResult | null> {
    let data: ApiResult;
    try {
      data = (await response.json()) as ApiResult;
    } catch {
      setError("The server response could not be verified. Reload before retrying.");
      return null;
    }
    if (!response.ok) {
      setError(data.error ?? "Unable to save the acceptance criterion.");
      return null;
    }
    if (!data.id || data.requirement_id?.toLowerCase() !== requirementId.toLowerCase()) {
      setError("The saved criterion could not be verified. Reload before retrying.");
      return null;
    }
    return data;
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || editing !== null) return;
    const content = normalized(newContent);
    if (!content) return;
    await run(async () => {
      const response = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const saved = await validatedResult(response);
      if (!saved) return;
      setItems((previous) => [...previous, saved].sort((a, b) => a.position - b.position));
      setNewContent("");
    });
  }

  async function save(id: string) {
    if (inFlight.current) return;
    const content = normalized(draft);
    if (!content) return;
    if (items.find((item) => item.id === id)?.content === content) {
      setEditing(null);
      return;
    }
    await run(async () => {
      const response = await fetch(base + "/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const saved = await validatedResult(response);
      if (!saved || saved.id !== id) return;
      setItems((previous) => previous.map((item) => item.id === id ? saved : item));
      setEditing(null);
    });
  }

  async function remove(id: string) {
    if (inFlight.current) return;
    if (!window.confirm("Delete this acceptance criterion? This action cannot be undone.")) return;
    await run(async () => {
      const response = await fetch(base + "/" + encodeURIComponent(id), { method: "DELETE" });
      if (response.status !== 204) {
        setError("The deletion could not be confirmed. Reload before trying again.");
        return;
      }
      setItems((previous) => previous.filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, position: index + 1 })));
      if (editing === id) setEditing(null);
    });
  }

  return (
    <section aria-labelledby="acceptance-criteria-heading" className="space-y-4 border-t border-slate-200 pt-6">
      <h3 id="acceptance-criteria-heading" className="text-base font-semibold text-slate-900">
        Acceptance Criteria
      </h3>
      <p className="text-sm text-slate-500">Define verifiable outcomes before designing tests.</p>
      {error && (
        <div role="alert" data-testid="acceptance-criteria-error"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {items.length === 0 ? (
        <p data-testid="acceptance-criteria-empty" className="text-sm text-slate-600">
          No acceptance criteria yet.
        </p>
      ) : (
        <ol data-testid="acceptance-criteria-list" className="space-y-3">
          {items.map((item) => (
            <li key={item.id} data-testid="acceptance-criterion-row" className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-xs font-semibold text-slate-500">AC-{item.position}</p>
                  {editing === item.id ? (
                    <div className="space-y-2">
                      <label htmlFor={"criterion-edit-" + item.id} className="sr-only">Edit criterion</label>
                      <textarea id={"criterion-edit-" + item.id} rows={3} maxLength={2000}
                        data-testid="acceptance-criterion-edit-input"
                        className="w-full rounded-md border border-slate-300 p-2 text-sm"
                        disabled={busy} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void save(item.id)} disabled={busy}
                          data-testid="acceptance-criterion-save"
                          className="rounded-md bg-sky-700 px-3 py-2 text-sm text-white disabled:opacity-50">
                          {busy ? "Saving…" : "Save criterion"}
                        </button>
                        <button type="button" disabled={busy} onClick={() => setEditing(null)}
                          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p data-testid="acceptance-criterion-content"
                      className="whitespace-pre-wrap break-words text-sm text-slate-800">{item.content}</p>
                  )}
                </div>
                {editing !== item.id && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" disabled={busy || editing !== null}
                      onClick={() => { setEditing(item.id); setDraft(item.content); setError(""); }}
                      className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                      aria-label={"Edit criterion AC-" + item.position}>Edit</button>
                    <button type="button" disabled={busy || editing !== null}
                      data-testid="acceptance-criterion-delete"
                      onClick={() => void remove(item.id)}
                      className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                      aria-label={"Delete criterion AC-" + item.position}>Delete</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <form noValidate onSubmit={(event) => void add(event)} className="space-y-2">
        <label htmlFor="acceptance-criterion-new" className="block text-sm font-medium text-slate-700">
          New acceptance criterion
        </label>
        <textarea id="acceptance-criterion-new" data-testid="acceptance-criterion-new-input"
          value={newContent} onChange={(event) => setNewContent(event.target.value)}
          maxLength={2000} rows={3} disabled={busy || editing !== null}
          className="w-full rounded-md border border-slate-300 p-3 text-sm disabled:bg-slate-100"
          placeholder="Given …, when …, then …" />
        <button type="submit" disabled={busy || editing !== null}
          data-testid="acceptance-criterion-add"
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400">
          {busy ? "Saving…" : "Add criterion"}
        </button>
      </form>
      <p role="status" aria-live="polite" className="text-xs text-slate-500">
        {busy ? "Updating acceptance criteria…" : items.length + " acceptance criteria"}
      </p>
    </section>
  );
}
