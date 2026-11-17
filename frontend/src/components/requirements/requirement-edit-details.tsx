import { notFound } from "next/navigation";
import Link from "next/link";
import { RequirementEditForm } from "@/components/requirements/requirement-edit-form";
import { AcceptanceCriteriaEditor } from "@/components/requirements/acceptance-criteria-editor";
import { getRequirement, getAcceptanceCriteria, RequirementNotFoundError } from "@/lib/requirements";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function RequirementEditDetails({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  let requirement;
  try {
    requirement = await getRequirement(id);
  } catch (error) {
    if (error instanceof RequirementNotFoundError) notFound();
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-700">Requirements API unavailable</h2>
        <p className="mt-2 text-sm text-slate-600">
          Unable to load this requirement for editing. Check FastAPI and PostgreSQL and refresh the page.
        </p>
      </section>
    );
  }
  // Acceptance criteria can be added or changed from the detail page without
  // editing the requirement itself. Fetch both resources fresh for this screen.
  let criteria;
  try {
    criteria = await getAcceptanceCriteria(requirement.id);
  } catch {
    criteria = null;
  }

  return (
    <>
      <Link href={`/requirements/${encodeURIComponent(requirement.id)}`}
        prefetch={false}
        className="inline-flex text-sm font-medium text-sky-700 hover:underline">
        ← Back to Requirement Details
      </Link>
      <RequirementEditForm
        key={JSON.stringify([requirement.id, requirement.title, requirement.description])}
        requirement={requirement}
      />
      {criteria ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Current acceptance criteria</h2>
          <p className="mt-2 mb-5 text-sm text-slate-600">
            These are the latest saved criteria for this requirement. Criteria are saved
            individually; the Save changes button above updates only title and description.
          </p>
          <AcceptanceCriteriaEditor
            key={JSON.stringify(criteria.map(item => [item.id, item.content, item.position]))}
            requirementId={requirement.id}
            initialItems={criteria}
          />
        </section>
      ) : (
        <section role="alert" className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
          Acceptance criteria could not be loaded. Refresh before editing this requirement.
        </section>
      )}
    </>
  );
}
