"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Requirement } from "@/lib/requirements";

type Field = "title" | "description";
type FieldErrors = Partial<Record<Field, string>>;
type ApiResult = {
  id?: string;
  error?: string;
  fieldErrors?: FieldErrors;
};

const UNKNOWN_SAVE = "We couldn't confirm that your changes were saved. Your information is still here. Check the requirement details before trying again.";

export function RequirementEditForm({ requirement }: { requirement: Requirement }) {
  const router = useRouter();
  const [title, setTitle] = useState(requirement.title);
  const [description, setDescription] = useState(requirement.description);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const detailUrl = `/requirements/${encodeURIComponent(requirement.id)}`;

  function resetDraft() {
    setTitle(requirement.title);
    setDescription(requirement.description);
    setErrors({});
    setFormError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const nextErrors: FieldErrors = {};
    if (!cleanTitle || cleanTitle.length > 255 || cleanTitle.includes(String.fromCharCode(0))) {
      nextErrors.title = "Enter a title between 1 and 255 characters.";
    }
    if (!cleanDescription || cleanDescription.length > 10000 || cleanDescription.includes(String.fromCharCode(0))) {
      nextErrors.description = "Enter a description between 1 and 10,000 characters.";
    }
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      document.getElementById(nextErrors.title ? "edit-requirement-title" : "edit-requirement-description")?.focus();
      return;
    }

    // Send only changed fields (partial PATCH); no server write on no-op.
    const changes: Partial<Record<Field, string>> = {};
    if (cleanTitle !== requirement.title) changes.title = cleanTitle;
    if (cleanDescription !== requirement.description) changes.description = cleanDescription;
    if (!Object.keys(changes).length) {
      setFormError("No changes to save.");
      return;
    }

    lock.current = true;
    setSaving(true);
    let navigated = false;
    try {
      const response = await fetch(`/api/requirements/${encodeURIComponent(requirement.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      let data: ApiResult;
      try {
        data = (await response.json()) as ApiResult;
      } catch {
        setFormError(UNKNOWN_SAVE);
        return;
      }
      if (!response.ok) {
        setErrors(data.fieldErrors ?? {});
        setFormError(data.error ?? UNKNOWN_SAVE);
        return;
      }
      if (!data.id || data.id.toLowerCase() !== requirement.id.toLowerCase()) {
        setFormError(UNKNOWN_SAVE);
        return;
      }
      navigated = true;
      router.replace(detailUrl);
      router.refresh();
    } catch {
      setFormError(UNKNOWN_SAVE);
    } finally {
      if (!navigated) {
        lock.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6" aria-labelledby="requirement-edit-heading">
      <h2 id="requirement-edit-heading" className="text-lg font-semibold">Edit requirement</h2>
      <p className="mt-2 break-all text-xs text-slate-500">ID: {requirement.id}</p>
      <form noValidate data-testid="requirement-edit-form" onSubmit={onSubmit} className="mt-6 space-y-6">
        {formError && (
          <div data-testid="requirement-edit-error" role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </div>
        )}
        <div>
          <label htmlFor="edit-requirement-title" className="block text-sm font-medium text-slate-800">
            Title *
          </label>
          <input id="edit-requirement-title" data-testid="requirement-edit-title"
            required minLength={1} maxLength={255} value={title}
            disabled={saving}
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((old) => ({ ...old, title: undefined }));
            }}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "edit-title-help edit-title-error" : "edit-title-help"}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:bg-slate-100" />
          <p id="edit-title-help" className="mt-1 text-xs text-slate-500">Maximum 255 characters.</p>
          {errors.title && <p id="edit-title-error" className="mt-1 text-sm text-red-700">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="edit-requirement-description" className="block text-sm font-medium text-slate-800">
            Description *
          </label>
          <textarea id="edit-requirement-description" data-testid="requirement-edit-description"
            required minLength={1} maxLength={10000} rows={6} value={description}
            disabled={saving}
            onChange={(event) => {
              setDescription(event.target.value);
              setErrors((old) => ({ ...old, description: undefined }));
            }}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "edit-description-help edit-description-error" : "edit-description-help"}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:bg-slate-100" />
          <p id="edit-description-help" className="mt-1 text-xs text-slate-500">Maximum 10,000 characters.</p>
          {errors.description && <p id="edit-description-error" className="mt-1 text-sm text-red-700">{errors.description}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          {saving ? (
            <span aria-disabled="true"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400">
              Cancel
            </span>
          ) : (
            <Link href={detailUrl} onClick={resetDraft}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-600">
              Cancel
            </Link>
          )}
          <button type="submit" data-testid="requirement-edit-submit" disabled={saving}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:bg-slate-400">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-slate-500">
          {saving ? "Updating requirement…" : ""}
        </p>
      </form>
    </section>
  );
}
