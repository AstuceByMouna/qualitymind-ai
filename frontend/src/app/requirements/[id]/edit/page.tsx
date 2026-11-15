import Link from "next/link";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { RequirementEditDetails } from "@/components/requirements/requirement-edit-details";

type Props = { params: Promise<{ id: string }> };

export default async function EditRequirementPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Quality Engineering / Requirements / Edit
            </p>
            <h1 className="mt-1 text-xl font-semibold">Edit Requirement</h1>
          </header>
          <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-10">
            <Link href={`/requirements/${encodeURIComponent(id)}`} className="inline-flex text-sm font-medium text-sky-700 hover:underline">
              ← Back to Requirement Details
            </Link>
            <Suspense fallback={<section role="status">Loading requirement…</section>}>
              <RequirementEditDetails params={params} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
