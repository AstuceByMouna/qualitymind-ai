import { Suspense } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TraceabilityView } from "@/components/requirements/traceability-view";

type Props = { params: Promise<{ id: string }> };

async function TraceabilityContent({ params }: Props) {
  const { id } = await params;
  return <TraceabilityView key={id} requirementId={id} />;
}

export default function TraceabilityPage({ params }: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar />
      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <h1 className="text-xl font-semibold">Requirement Traceability</h1>
        </header>
        <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-10">
          <Link href="/" className="text-sm font-medium text-sky-700 underline">
            Back to Requirements Registry
          </Link>
          <Suspense fallback={<p role="status">Loading traceability…</p>}>
            <TraceabilityContent params={params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
