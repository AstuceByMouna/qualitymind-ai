import { AppSidebar } from "@/components/layout/app-sidebar";
import { GovernanceWorkbench } from "@/components/governance/governance-workbench";

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar activeSection="governance" />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Quality Engineering / Governance</p>
            <h1 className="mt-1 text-xl font-semibold">Quality Governance</h1>
          </header>
          <div className="mx-auto max-w-7xl p-6 lg:p-10"><GovernanceWorkbench /></div>
        </main>
      </div>
    </div>
  );
}
