import { notFound } from "next/navigation";
import { RequirementEditForm } from "@/components/requirements/requirement-edit-form";
import { getRequirement, RequirementNotFoundError } from "@/lib/requirements";

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
  return <RequirementEditForm key={requirement.id} requirement={requirement} />;
}
