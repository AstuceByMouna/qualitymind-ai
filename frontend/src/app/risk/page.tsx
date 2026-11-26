import { AppSidebar } from "@/components/layout/app-sidebar";
import { RiskWorkbench } from "@/components/risk/risk-workbench";

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar activeSection="risk" />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Quality Engineering / Risk-Based Testing</p>
            <h1 className="mt-1 text-xl font-semibold">Risk-Based Testing — MVP</h1>
          </header>
          <div className="mx-auto max-w-6xl p-6 lg:p-10">
            <RiskWorkbench />
          </div>
        </main>
      </div>
    </div>
  );
}
