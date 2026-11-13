import Link from "next/link";

export function RequirementCreateForm() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6" aria-labelledby="create-requirement-title">
      <h2 id="create-requirement-title" className="text-lg font-semibold">Create a requirement</h2>
      <p className="mt-2 text-sm text-slate-600">
        Record a requirement for Requirements Intelligence. Fields marked * are required.
      </p>
      <form data-testid="requirement-create-form" className="mt-6 space-y-6">
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
            data-testid="requirement-title"
            aria-describedby="requirement-title-help"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          />
          <p id="requirement-title-help" className="mt-1 text-xs text-slate-500">
            Maximum 255 characters.
          </p>
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
            data-testid="requirement-description"
            aria-describedby="requirement-description-help"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          />
          <p id="requirement-description-help" className="mt-1 text-xs text-slate-500">
            Maximum 10,000 characters.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <Link href="/" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled
            data-testid="requirement-create-submit"
            aria-describedby="requirement-submit-help"
            className="cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-600"
          >
            Create Requirement
          </button>
        </div>
        <p id="requirement-submit-help" className="text-sm text-slate-500" role="status">
          Saving is not available yet. FastAPI integration and validation are the next increment of QA-82.
        </p>
      </form>
    </section>
  );
}
