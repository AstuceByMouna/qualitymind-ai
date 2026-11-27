import { AppSidebar } from "@/components/layout/app-sidebar";
import { FailureWorkbench } from "@/components/failure-analysis/failure-workbench";

export default function FailureAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar activeSection="failure-analysis" />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Quality Engineering / Failure Analysis
            </p>
            <h1 className="mt-1 text-xl font-semibold">Intelligent Failure Analysis — MVP</h1>
          </header>
          <div className="mx-auto max-w-5xl p-6 lg:p-10">
            <FailureWorkbench />
          </div>
        </main>
      </div>
    </div>
  );
}
