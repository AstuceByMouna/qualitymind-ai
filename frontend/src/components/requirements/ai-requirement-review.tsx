"use client";
import {useEffect,useState} from "react";
type Suggestion={id:string;category:string;observation:string;rationale:string;recommendation:string;suggested_test_case:string|null;risk_level:string;decision:string;edited_recommendation:string|null};
type Run={id:string;model:string;prompt_version:string;state:string;error_code:string|null;stale:boolean;suggestions:Suggestion[];created_at:string};
export function AIRequirementReview({requirementId,eligible}:{requirementId:string;eligible:boolean}){
 const [consent,setConsent]=useState(false),[attest,setAttest]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[runs,setRuns]=useState<Run[]>([]);
 const [edits,setEdits]=useState<Record<string,string>>({});
 const base="/api/requirements/"+encodeURIComponent(requirementId)+"/ai-analysis";
 async function refresh(){
  try{const r=await fetch(base,{cache:"no-store"});if(!r.ok)throw Error();setRuns(await r.json());}
  catch{setError("Cannot retrieve AI review history.");}
 }
 useEffect(()=>{
  let active=true;
  fetch(base,{cache:"no-store"}).then(response=>{
    if(!response.ok)throw new Error("History unavailable");
    return response.json();
  }).then(data=>{
    if(active)setRuns(data as Run[]);
  }).catch(()=>{
    if(active)setError("Cannot retrieve AI review history.");
  });
  return ()=>{active=false;};
 },[base]);
 async function analyze(){
  if(busy||!consent||!attest)return;setBusy(true);setError("");
  try{const r=await fetch(base,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({consent_to_external_processing:true,confirms_no_sensitive_data:true})});
   const v=await r.json();if(!r.ok){setError(v.error||"AI unavailable.");await refresh();}
   else{setRuns(p=>[v,...p]);setConsent(false);setAttest(false);}
  }catch{setError("Unknown result; inspect history before retrying.");await refresh();}
  finally{setBusy(false);}
 }
 async function review(run:Run,s:Suggestion,decision:"accepted"|"edited"|"rejected"){
  if(busy||run.stale||s.decision!=="pending")return;
  const replacement=edits[s.id]?.trim();
  if(decision==="edited"&&!replacement){setError("Write an edited recommendation first.");return;}
  setBusy(true);setError("");
  try{const r=await fetch(base+"/"+encodeURIComponent(run.id)+"/suggestions/"+encodeURIComponent(s.id)+"/review",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({decision,edited_recommendation:decision==="edited"?replacement:null})});
   const v=await r.json();if(!r.ok){setError(v.error||"Review was not recorded.");await refresh();}
   else setRuns(p=>p.map(x=>x.id===run.id?v:x));
  }catch{setError("Unknown review result; refresh before retrying.");await refresh();}
  finally{setBusy(false);}
 }
 return <section className="space-y-4 rounded-xl border border-slate-200 p-5" aria-label="AI-assisted requirement review">
   <h3 className="font-semibold">AI-assisted requirements review</h3>
   <p className="text-sm text-slate-600">OpenAI is an external provider. Suggestions never modify the original requirement or approve themselves.</p>
   {!eligible?<p className="text-sm">Available only for active imported requirements with provenance.</p>:
   <div className="space-y-2">
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
      I authorize sending this requirement and its acceptance criteria to OpenAI.</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={attest} onChange={e=>setAttest(e.target.checked)}/>
      I have checked this content is authorized for external processing and contains no sensitive information or secrets.</label>
    <button type="button" disabled={busy||!consent||!attest} data-testid="ai-analyze"
      className="rounded bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={()=>void analyze()}>
      {busy?"Analyzing...":"Analyze with OpenAI"}</button>
   </div>}
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   <div data-testid="ai-analysis-history" className="space-y-4">
    {runs.map(run=><article key={run.id} className="space-y-3 border-t pt-4">
      <p className="font-semibold text-sm">Analysis {new Date(run.created_at).toLocaleString()} — {run.state}</p>
      <p className="text-xs text-slate-600">Model: {run.model} · Prompt: {run.prompt_version} · {run.suggestions.length} suggestions</p>
      {run.stale&&<p role="alert" className="text-amber-800">Requirement changed after this analysis; re-analyze before review.</p>}
      {run.error_code&&<p role="alert">Provider status: {run.error_code}</p>}
      {run.state==="completed"&&!run.suggestions.length&&<p>No suggestions. Human review remains necessary.</p>}
      {run.suggestions.map(s=><div key={s.id} className="space-y-2 rounded border p-3 text-sm">
       <p className="font-semibold">{s.category} · {s.risk_level} risk · {s.decision}</p>
       <p>{s.observation}</p><p>{s.rationale}</p><p>Recommendation: {s.recommendation}</p>
       {s.suggested_test_case&&<p>Proposed test: {s.suggested_test_case}</p>}
       {s.edited_recommendation&&<p>Human edit: {s.edited_recommendation}</p>}
       {s.decision==="pending"&&!run.stale&&<div className="space-y-2">
        <label className="block">Edited recommendation
          <textarea maxLength={1500} className="block w-full rounded border p-2" value={edits[s.id]||""}
            onChange={e=>setEdits(p=>({...p,[s.id]:e.target.value}))}/></label>
        <div className="flex flex-wrap gap-2">{(["accepted","edited","rejected"] as const).map(d=>
         <button key={d} type="button" disabled={busy} onClick={()=>void review(run,s,d)}
           className="rounded border px-3 py-2 disabled:opacity-50">{d==="accepted"?"Accept":d==="edited"?"Save edited":"Reject"}</button>)}</div>
       </div>}
      </div>)}
    </article>)}
   </div>
 </section>;
}