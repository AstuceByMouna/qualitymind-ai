import { getRequirements } from "@/lib/requirements";
import { redirect } from "next/navigation";
import { RequirementsRegistry } from "@/components/requirements/requirements-registry";

const PAGE_SIZE = 5;
type PageProps = { searchParams: Promise<{ page?: string | string[]; q?: string | string[]; archived?: string }> };

export async function RequirementsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const archived = params.archived === "true";
  const parsedPage = Number(rawPage);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 100000)
    : 1;

  let requirements = null;
  let apiError = false;

  try {
    requirements = await getRequirements(PAGE_SIZE, (page - 1) * PAGE_SIZE, query, archived);
  } catch {
    apiError = true;
  }

  // Normalize out-of-range URLs after the server has counted filtered rows.
  // The canonical URL always displays a real page, never "Page 100 of 2".
  if (requirements && page > 1) {
    const lastPage = Math.max(1, Math.ceil(requirements.total / PAGE_SIZE));
    if (page > lastPage) {
      const url = new URLSearchParams();
      if (query) url.set("q", query);
      if (archived) url.set("archived", "true");
      if (lastPage > 1) url.set("page", String(lastPage));
      redirect(url.size ? `/?${url.toString()}` : "/");
    }
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
        key={`${page}:${query}`}
        query={query}
        archived={archived}
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
