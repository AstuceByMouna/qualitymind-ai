import Link from "next/link";

export default function RequirementNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          404 — Requirement not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          This requirement is unavailable
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The identifier is invalid or no matching requirement exists.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          Back to Requirements Registry
        </Link>
      </section>
    </main>
  );
}
