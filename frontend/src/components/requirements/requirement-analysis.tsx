"use client";
import {useState} from "react";
type Finding = {rule_id:string;category:string;observation:string;rationale:string;suggestion:string;evidence:string|null;nature:string};
type Analysis = {requirement_id:string;engine:"rules";ruleset_version:string;analyzed_at:string;findings:Finding[];human_review_required:boolean};

export function RequirementAnalysis({requirementId}:{requirementId:string}) {
  const [result,setResult] = useState<Analysis|null>(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function analyze(){
    if(busy)return;
    setBusy(true);setError("");setResult(null);
    try{
      const response=await fetch("/api/requirements/"+encodeURIComponent(requirementId)+"/quality-analysis",{method:"POST"});
      const data=await response.json();
      if(!response.ok){setError(response.status===404?"Requirement not found.":"Analysis service unavailable. Try again.");return;}
      if(data.requirement_id!==requirementId||!Array.isArray(data.findings)){setError("Invalid analysis result.");return;}
      setResult(data as Analysis);
    }catch{setError("Analysis service unavailable. Try again.");}
    finally{setBusy(false);}
  }
  return <section aria-label="Requirement quality analysis" className="rounded-xl border border-slate-200 p-5 space-y-3">
    <h3 className="font-semibold">Testability analysis</h3>
    <p className="text-xs text-slate-500">Deterministic rules only. Findings are hints for QA review, not automatic decisions.</p>
    <button data-testid="analyze-requirement" type="button" disabled={busy} onClick={()=>void analyze()}
      className="rounded bg-sky-700 text-white px-4 py-2 text-sm disabled:opacity-50">
      {busy?"Analyzing...":"Analyze requirement"}
    </button>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {result&&<div data-testid="quality-analysis-results" className="space-y-3">
      <p className="text-sm text-slate-600">Ruleset {result.ruleset_version} · {result.findings.length} review hints</p>
      {result.findings.length===0?<p>No potential issues detected by this ruleset. Human review is still required.</p>:
        <ul className="space-y-3">{result.findings.map((f,i)=><li key={f.rule_id+":"+i} className="rounded border p-3 text-sm space-y-1">
          <p className="font-semibold">{f.category}: {f.observation}</p>
          <p>{f.rationale}</p>
          <p className="text-sky-800">Suggestion: {f.suggestion}</p>
        </li>)}</ul>}
      <p className="text-xs text-slate-600">Human review required. This analysis has not changed the requirement.</p>
    </div>}
  </section>;
}
