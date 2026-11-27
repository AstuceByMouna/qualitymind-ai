import Link from "next/link";

const navigation = [
  { label: "Overview", icon: "◫", available: false, href: "" },
  { label: "Requirements", icon: "≡", available: true, href: "/" },
  { label: "AI Test Design", icon: "◇", available: true, href: "/test-design" },
  { label: "Risk-Based Testing", icon: "△", available: true, href: "/risk" },
  { label: "Automation Hub", icon: "▣", available: false, href: "" },
  { label: "Failure Analysis", icon: "⌕", available: true, href: "/failure-analysis" },
  { label: "Quality Governance", icon: "▤", available: true, href: "/governance" },
];

type AppSidebarProps = {
  activeSection?: "requirements" | "governance" | "test-design" | "risk" | "failure-analysis";
};

/** Navigation state is provided by server routes: no client-only router hook. */
export function AppSidebar({ activeSection = "requirements" }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 bg-slate-950 p-6 text-white md:block">
      <div className="mb-10">
        <div className="text-xl font-bold tracking-tight">
          QualityMind <span className="text-sky-400">AI</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Enterprise Quality Engineering</p>
      </div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Workspace</p>
      <nav aria-label="Main navigation" className="space-y-1">
        {navigation.map((item) => {
          const active = item.href === "/failure-analysis"
            ? activeSection === "failure-analysis"
            : item.href === "/risk"
            ? activeSection === "risk"
            : item.href === "/governance"
            ? activeSection === "governance"
            : item.href === "/test-design"
              ? activeSection === "test-design"
              : item.href === "/" && activeSection === "requirements";
          return item.available ? (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-sky-400 ${active ? "bg-sky-500/15 text-sky-300" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ) : (
            <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-500">
              <span className="flex items-center gap-3"><span aria-hidden="true">{item.icon}</span>{item.label}</span>
              <span className="text-[10px]">Soon</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
