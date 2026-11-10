import { getRequirements } from "@/lib/requirements";
import { RequirementsRegistry } from "@/components/requirements/requirements-registry";

const PAGE_SIZE = 5;
type PageProps = { searchParams: Promise<{ page?: string | string[] }> };

export async function RequirementsContent({ searchParams }: PageProps) {
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

export function RequirementsLoading() {
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
