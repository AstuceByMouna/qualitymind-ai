import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { RequirementCreateForm } from "@/components/requirements/requirement-create-form";

export default function NewRequirementPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Quality Engineering / Requirements / Create
            </p>
            <h1 className="mt-1 text-xl font-semibold">New Requirement</h1>
          </header>
          <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-10">
            <Link
              href="/"
              className="inline-flex rounded-md text-sm font-medium text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              ← Back to Requirements Registry
            </Link>
            <RequirementCreateForm />
          </div>
        </main>
      </div>
    </div>
  );
}
