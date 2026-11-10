
import Link from "next/link";
import { Suspense } from "react";
import { getRequirements } from "@/lib/requirements";
import { RequirementsRegistry } from "@/components/requirements/requirements-registry";

const PAGE_SIZE = 5;
const navigation = [
  { label: "Overview", icon: "◫", available: false },
  { label: "Requirements", icon: "≡", available: true },
  { label: "AI Test Design", icon: "◇", available: false },
  { label: "Risk Analysis", icon: "△", available: false },
  { label: "Automation Hub", icon: "▣", available: false },
  { label: "Failure Analysis", icon: "⌕", available: false },
  { label: "Quality Governance", icon: "▤", available: false },
];

type PageProps = { searchParams: Promise<{ page?: string | string[] }> };

export default function Home({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-slate-950 p-6 text-white md:block">
          <div className="mb-10">
            <div className="text-xl font-bold tracking-tight">
              QualityMind <span className="text-sky-400">AI</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Enterprise Quality Engineering
            </p>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav aria-label="Main navigation" className="space-y-1">
            {navigation.map((item) =>
              item.available ? (
                <Link
                  key={item.label}
                  href="/"
                  aria-current="page"
                  className="flex items-center gap-3 rounded-lg bg-sky-500/15 px-3 py-3 text-sm font-medium text-sky-300"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-500"
                >
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-[10px]">Soon</span>
                </div>
              ),
            )}
          </nav>
        </aside>

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

async function RequirementsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const parsedPage = Number(rawPage);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 100000)
    : 1;

  let requirements = null;
  let apiError = false;

  try {
    requirements = await getRequirements(PAGE_SIZE, (page - 1) * PAGE_SIZE);
  } catch {
    apiError = true;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Workspace status">
        {[
          ["Requirements API", apiError ? "Connection error" : "Connected"],
          ["AI Test Design", "Planned"],
          ["Quality Gates", "Planned"],
        ].map(([title, status]) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-3 text-lg font-semibold">{status}</p>
          </div>
        ))}
      </section>
      <RequirementsRegistry
        key={page}
        data={requirements}
        apiError={apiError}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}

function RequirementsLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-3" aria-label="Workspace status">
        {["Requirements API", "AI Test Design", "Quality Gates"].map((title) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{title}</p>
            <div className="mt-3 h-6 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold">Requirements Registry</p>
        <p className="mt-2 text-sm text-slate-500">Loading requirements from FastAPI…</p>
        <div className="mt-4 h-24 animate-pulse rounded bg-slate-50" />
      </div>
    </div>
  );
}
