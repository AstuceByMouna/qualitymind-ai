"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type FieldName = "title" | "description";
type FieldErrors = Partial<Record<FieldName, string>>;

type ApiResult = {
  id?: string;
  error?: string;
  fieldErrors?: FieldErrors;
};

export function RequirementCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const errors: FieldErrors = {};

    if (!cleanTitle || cleanTitle.length > 255 || cleanTitle.includes("\0")) {
      errors.title = "Enter a title between 1 and 255 characters.";
    }
    if (!cleanDescription || cleanDescription.length > 10000 || cleanDescription.includes("\0")) {
      errors.description = "Enter a description between 1 and 10,000 characters.";
    }

    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) {
      document.getElementById(errors.title ? "requirement-title" : "requirement-description")?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle, description: cleanDescription }),
      });
      const data = (await response.json()) as ApiResult;

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setFormError(data.error ?? "Unable to save the requirement. Please try again.");
        return;
      }

      if (!data.id) {
        setFormError("The server did not return an identifier. Check the registry before retrying.");
        return;
      }

      router.push(`/requirements/${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch {
      setFormError("Unable to contact the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6"
      aria-labelledby="create-requirement-title"
    >
      <h2 id="create-requirement-title" className="text-lg font-semibold">
        Create a requirement
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Record a requirement for Requirements Intelligence. Fields marked * are required.
      </p>

      <form
        noValidate
        onSubmit={handleSubmit}
        data-testid="requirement-create-form"
        className="mt-6 space-y-6"
      >
        {formError && (
          <div
            role="alert"
            data-testid="requirement-create-error"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {formError}
          </div>
        )}
        <div>
          <label htmlFor="requirement-title" className="block text-sm font-medium text-slate-800">
            Title *
          </label>
          <input
            id="requirement-title"
            name="title"
            type="text"
            required
            minLength={1}
            maxLength={255}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setFieldErrors((prev) => ({ ...prev, title: undefined }));
            }}
            disabled={isSubmitting}
            data-testid="requirement-title"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? "requirement-title-help requirement-title-error" : "requirement-title-help"}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:bg-slate-100"
          />
          <p id="requirement-title-help" className="mt-1 text-xs text-slate-500">
            Maximum 255 characters.
          </p>
          {fieldErrors.title && (
            <p id="requirement-title-error" className="mt-1 text-sm text-red-700">
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="requirement-description" className="block text-sm font-medium text-slate-800">
            Description *
          </label>
          <textarea
            id="requirement-description"
            name="description"
            required
            minLength={1}
            maxLength={10000}
            rows={6}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setFieldErrors((prev) => ({ ...prev, description: undefined }));
            }}
            disabled={isSubmitting}
            data-testid="requirement-description"
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? "requirement-description-help requirement-description-error" : "requirement-description-help"}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:bg-slate-100"
          />
          <p id="requirement-description-help" className="mt-1 text-xs text-slate-500">
            Maximum 10,000 characters.
          </p>
          {fieldErrors.description && (
            <p id="requirement-description-error" className="mt-1 text-sm text-red-700">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <Link
            href="/"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="requirement-create-submit"
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-wait disabled:bg-slate-400"
          >
            {isSubmitting ? "Saving…" : "Create Requirement"}
          </button>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-slate-500">
          {isSubmitting ? "Saving the requirement…" : ""}
        </p>
      </form>
    </section>
  );
}
