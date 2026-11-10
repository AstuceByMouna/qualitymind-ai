import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { RequirementsContent, RequirementsLoading } from "@/components/requirements/requirements-content";

type PageProps = { searchParams: Promise<{ page?: string | string[] }> };

export default function Home({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Quality Engineering / Requirements
              </p>
              <h1 className="text-xl font-semibold">Requirements Workbench</h1>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
              MVP
            </span>
          </header>
          <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Requirements Intelligence
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Centralize requirements, maintain traceability and prepare
                risk-based quality activities.
              </p>
            </div>
            <Suspense fallback={<RequirementsLoading />}>
              <RequirementsContent searchParams={searchParams} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
