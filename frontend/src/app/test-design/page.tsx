import { AppSidebar } from "@/components/layout/app-sidebar";
import { TestDesignWorkbench } from "@/components/test-design/test-design-workbench";

export default function TestDesignPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar activeSection="test-design" />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Quality Engineering / Test Design</p>
            <h1 className="mt-1 text-xl font-semibold">AI Test Design — MVP</h1>
          </header>
          <div className="mx-auto max-w-6xl p-6 lg:p-10">
            <TestDesignWorkbench />
          </div>
        </main>
      </div>
    </div>
  );
}
