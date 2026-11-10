import Link from "next/link";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { RequirementDetails } from "@/components/requirements/requirement-details";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function RequirementDetailPage({ params }: DetailPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Quality Engineering / Requirements / Detail
            </p>
            <h1 className="mt-1 text-xl font-semibold">Requirement Details</h1>
          </header>
          <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-10">
            <Link
              href="/"
              className="inline-flex rounded-md text-sm font-medium text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              ← Back to Requirements Registry
            </Link>
            <Suspense fallback={<DetailLoading />}>
              <RequirementDetails params={params} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function DetailLoading() {
  return (
    <section role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">Loading requirement details…</p>
      <div className="mt-4 h-8 w-3/5 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-28 animate-pulse rounded bg-slate-50" />
    </section>
  );
}
