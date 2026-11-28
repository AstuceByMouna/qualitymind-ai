import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { JiraPreview } from "@/components/requirements/jira-preview";

export default function JiraPreviewPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl space-y-4 p-6 lg:p-10">
          <Link href="/" className="text-sm font-medium text-sky-700 underline">Back to Requirements Registry</Link>
          <h1 className="text-2xl font-semibold">Jira requirements preview</h1>
          <JiraPreview />
        </div>
      </main>
    </div>
  );
}
