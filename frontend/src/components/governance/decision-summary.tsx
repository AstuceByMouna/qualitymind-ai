const guidance: Record<string, string> = {
  NO_GO: "Hold the release. Address the blocking issues and review the assessment again.",
  REVIEW_REQUIRED: "Send the release evidence and any open objections to the decision owner for review.",
  UNDETERMINED: "Supply current evidence for the critical obligations before reviewing the release.",
};

export function DecisionSummary({ label, state, explanation }: {
  label: string; state: string; explanation?: string;
}) {
  return (
    <section aria-label={label} className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-sm">
      <h4 className="font-semibold">{label}</h4>
      <p className={state === "NO_GO" ? "font-semibold text-rose-900" : "font-semibold text-slate-900"}>{state}</p>
      {explanation && <p className="text-slate-700">{explanation}</p>}
      <p className="text-slate-700">{guidance[state] ?? "Check the assessment returned by the governance service."}</p>
    </section>
  );
}
