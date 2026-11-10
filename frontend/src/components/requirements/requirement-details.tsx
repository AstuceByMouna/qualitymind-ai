import { notFound } from "next/navigation";
import { getRequirement, RequirementNotFoundError } from "@/lib/requirements";

type Props = { params: Promise<{ id: string }> };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function RequirementDetails({ params }: Props) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  let detail;
  try {
    detail = await getRequirement(id);
  } catch (error) {
    if (error instanceof RequirementNotFoundError) {
      notFound();
    }

    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-700">Requirements API unavailable</h2>
        <p className="mt-2 text-sm text-slate-600">
          Unable to load this requirement. Check that FastAPI and PostgreSQL are running, then refresh the page.
        </p>
      </section>
    );
  }

  return (
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Requirement record
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {detail.title}
        </h2>
      </div>
      <dl className="grid gap-5 md:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirement ID</dt>
          <dd className="mt-2 break-all font-mono text-sm text-slate-800">{detail.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created on</dt>
          <dd className="mt-2 text-sm text-slate-800">
            {new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" })
              .format(new Date(detail.created_at))}
          </dd>
        </div>
      </dl>
      <section aria-labelledby="requirement-description-title">
        <h3 id="requirement-description-title" className="text-sm font-semibold text-slate-700">
          Description
        </h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
          {detail.description}
        </p>
      </section>
    </article>
  );
}
