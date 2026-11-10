import Link from "next/link";

const navigation = [
  { label: "Overview", icon: "◫", available: false },
  { label: "Requirements", icon: "≡", available: true },
  { label: "AI Test Design", icon: "◇", available: false },
  { label: "Risk Analysis", icon: "△", available: false },
  { label: "Automation Hub", icon: "▣", available: false },
  { label: "Failure Analysis", icon: "⌕", available: false },
  { label: "Quality Governance", icon: "▤", available: false },
];

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 bg-slate-950 p-6 text-white md:block">
      <div className="mb-10">
        <div className="text-xl font-bold tracking-tight">
          QualityMind <span className="text-sky-400">AI</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Enterprise Quality Engineering
        </p>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Workspace
      </p>

      <nav aria-label="Main navigation" className="space-y-1">
        {navigation.map((item) =>
          item.available ? (
            <Link
              key={item.label}
              href="/"
              aria-current="page"
              className="flex items-center gap-3 rounded-lg bg-sky-500/15 px-3 py-3 text-sm font-medium text-sky-300"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-500"
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </span>
              <span className="text-[10px]">Soon</span>
            </div>
          ),
        )}
      </nav>
    </aside>
  );
}
