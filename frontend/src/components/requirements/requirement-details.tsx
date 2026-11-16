import { notFound } from "next/navigation";
import Link from "next/link";
import { getRequirement, getAcceptanceCriteria, RequirementNotFoundError } from "@/lib/requirements";
import { ArchiveRequirement } from "@/components/requirements/archive-requirement";
import { RequirementLifecycle } from "@/components/requirements/requirement-lifecycle";
import { AcceptanceCriteriaEditor } from "@/components/requirements/acceptance-criteria-editor";

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

  let criteria;
  try {
    criteria = await getAcceptanceCriteria(detail.id);
  } catch {
    criteria = null;
  }

  return (
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Requirement record
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {detail.title}
        </h2>
        </div>
        {!detail.archived_at && <Link href={`/requirements/${encodeURIComponent(detail.id)}/edit`}
          data-testid="requirement-edit-link"
          className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
          Edit Requirement
        </Link>}
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
      {detail.import_source && <section aria-label="Import provenance" className="rounded-md border p-4 text-sm">
        <p className="font-semibold">Imported requirement</p>
        <p>Source: {detail.import_source}</p>
        <p>External ID: {detail.external_id}</p>
        {detail.priority && <p>Priority: {detail.priority}</p>}
      </section>}
      <ArchiveRequirement requirementId={detail.id} archived={Boolean(detail.archived_at)} />
      {!detail.archived_at && <RequirementLifecycle requirementId={detail.id} initialStatus={detail.status} />}
      <section aria-labelledby="requirement-description-title">
        <h3 id="requirement-description-title" className="text-sm font-semibold text-slate-700">
          Description
        </h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
          {detail.description}
        </p>
      </section>
      {criteria ? (
        <AcceptanceCriteriaEditor requirementId={detail.id} initialItems={criteria} />
      ) : (
        <section role="alert" className="border-t border-red-200 pt-4 text-sm text-red-800">
          Acceptance criteria are unavailable. Check the API and refresh this page.
        </section>
      )}
    </article>
  );
}
