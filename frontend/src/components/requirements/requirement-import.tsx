"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = {row:number;external_id:string;title:string;description:string;priority:string;acceptance_criteria:string;decision:string;error:string|null;requirement_id:string|null};
type Preview = {id:string;source_name:string;state:string;accepted:number;rejected:number;ignored:number;rows:Row[]};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function RequirementImport() {
  const [file,setFile]=useState<File|null>(null);
  const [mapping,setMapping]=useState("{}");
  const [preview,setPreview]=useState<Preview|null>(null);
  const [completed,setCompleted]=useState<Preview|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const lock=useRef(false);
  const fileInput=useRef<HTMLInputElement|null>(null);
  const router=useRouter();

  async function run(action:()=>Promise<void>) {
    if(lock.current)return;
    lock.current=true;setBusy(true);setError("");
    try {await action();}catch{setError("Unable to confirm the operation. Check the batch before retrying.");}
    finally{lock.current=false;setBusy(false);}
  }
  async function previewFile(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!file){setError("Select a CSV or XLSX file.");return;}
    if(file.size>2*1024*1024){setError("Maximum file size is 2 MiB.");return;}
    try{const parsed=JSON.parse(mapping);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();}
    catch{setError("Column mapping must be a JSON object.");return;}
    setPreview(null);
    setCompleted(null);
    await run(async()=>{
      const payload=new FormData();payload.set("file",file);payload.set("mapping",mapping);
      const response=await fetch("/api/imports/preview",{method:"POST",body:payload});
      const result=await response.json();
      if(!response.ok){setError(result.error||"Preview rejected.");return;}
      if(!result.id||!Array.isArray(result.rows)){setError("Invalid preview response.");return;}
      setPreview(result as Preview);
    });
  }
  async function confirm(){
    if(!preview||preview.rejected||preview.state==="confirmed")return;
    await run(async()=>{
      const response=await fetch("/api/imports/"+encodeURIComponent(preview.id)+"/confirm",{method:"POST"});
      const result=await response.json();
      if(!response.ok||result.id!==preview.id||result.state!=="confirmed"||!Array.isArray(result.rows)){
        setError(result.error||"Import outcome not verified. Check batch status before retrying.");
        return;
      }
      if(result.rows.some((row:Row)=>row.decision==="create"&&!UUID.test(String(row.requirement_id||"")))){
        setError("Import confirmed but requirement links could not be verified. Refresh the registry.");
        setPreview(result as Preview);router.refresh();return;
      }
      const confirmed=result as Preview;
      const created=confirmed.rows.filter((row:Row)=>row.decision==="create");
      setPreview(null);
      setFile(null);
      setMapping("{}");
      if(fileInput.current)fileInput.current.value="";
      if(confirmed.rows.length===1&&created.length===1&&UUID.test(String(created[0].requirement_id||""))){
        router.push("/requirements/"+encodeURIComponent(String(created[0].requirement_id)));
      }else{
        setCompleted(confirmed);
        router.replace("/");
        router.refresh();
      }
    });
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-label="Requirement import">
    <div className="space-y-1">
      <h3 className="font-semibold">Import requirements (CSV / XLSX)</h3>
      <p className="text-xs text-slate-600">Review every field before importing. No requirements are created until you confirm.</p>
    </div>
    {completed ? <div data-testid="requirement-import-completed" role="status" className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="font-semibold text-emerald-900">Import completed</p>
      <p className="text-sm text-emerald-950">{completed.accepted} created · {completed.ignored} already existed · {completed.rejected} rejected</p>
      {completed.rows.some(row=>row.requirement_id&&UUID.test(row.requirement_id))&&<div className="space-y-2">
        <p className="text-sm font-semibold">Open an imported requirement</p>
        <ul className="space-y-1">{completed.rows.filter(row=>row.requirement_id&&UUID.test(row.requirement_id)).map(row=>
          <li key={row.row} className="min-w-0">
            <Link href={`/requirements/${encodeURIComponent(String(row.requirement_id))}`}
              data-testid="requirement-import-completed-link"
              className="inline-block break-words text-sm font-medium text-sky-800 underline underline-offset-2 hover:text-sky-950">
              {row.title||row.external_id}
            </Link>
          </li>)}</ul>
      </div>}
      <button type="button" data-testid="requirement-import-another"
        onClick={()=>{setCompleted(null);setPreview(null);setError("");}}
        className="rounded-md border border-sky-700 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50">
        Import another file
      </button>
    </div> : <form onSubmit={e=>void previewFile(e)} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,250px)_auto] lg:items-end">
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold text-slate-800" id="import-file-title">Import file</p>
        <input ref={fileInput} id="requirement-import-file" data-testid="requirement-import-file"
          type="file" accept=".csv,.xlsx" disabled={busy}
          aria-labelledby="import-file-title" className="peer sr-only"
          onChange={e=>{setFile(e.target.files?.[0]??null);setPreview(null);setError("");}} />
        <label htmlFor="requirement-import-file"
          className="flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-sky-500 hover:bg-sky-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-700">
          <span className="text-sm font-semibold text-sky-800">{file?"Choose a different file":"Click to choose a CSV or XLSX file"}</span>
          <span className="mt-1 text-xs text-slate-600">CSV / XLSX · 2 MiB maximum · 500 rows maximum</span>
        </label>
        {file?<p data-testid="requirement-import-selected-file" className="min-w-0 break-all rounded bg-sky-50 px-3 py-2 text-sm text-slate-800" aria-live="polite">
          <strong>Selected file: </strong>{file.name}
        </p>:<p className="text-xs text-slate-500">No file selected.</p>}
      </div>
      <label className="block space-y-2 text-sm font-semibold text-slate-700">Optional mapping JSON
        <input data-testid="requirement-import-mapping" value={mapping} disabled={busy}
          onChange={e=>{setMapping(e.target.value);setPreview(null);setError("");}}
          className="block w-full rounded border border-slate-300 bg-white p-2 font-mono text-xs"
          aria-label="Column mapping JSON" />
      </label>
      <button data-testid="requirement-import-preview" type="submit" disabled={busy||!file}
        className="rounded bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
        {busy?"Processing...":"Preview"}
      </button>
    </form>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {!completed&&preview&&<div data-testid="requirement-import-results" className="space-y-4 border-t border-slate-200 pt-4">
      <div aria-live="polite" className={preview.state==="confirmed"?"rounded-md border border-emerald-200 bg-emerald-50 p-3":"space-y-1"}>
        <p className="text-sm font-semibold">{preview.state}: {preview.accepted} create / {preview.ignored} ignore / {preview.rejected} reject</p>
        <p className="text-xs text-slate-600">{preview.state==="confirmed"?
          "Import confirmed. Open an imported requirement below, or return to the registry.":
          "Inspect the complete values below. No requirement is created until Confirm import."}</p>
      </div>
      <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3" aria-label="Staged requirement preview">
        {preview.rows.map(row=><article key={row.row} data-testid="requirement-import-row"
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Row {row.row}</span>
            <span className={`rounded px-2 py-1 text-xs font-semibold ${row.decision==="reject"?"bg-red-100 text-red-800":row.decision==="ignore"?"bg-amber-100 text-amber-800":"bg-emerald-50 text-emerald-800"}`}>{row.decision}</span>
          </div>
          <dl className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0"><dt className="text-xs font-semibold text-slate-500">External ID</dt><dd className="break-all text-sm">{row.external_id||"Not provided"}</dd></div>
            <div className="min-w-0"><dt className="text-xs font-semibold text-slate-500">Priority</dt><dd className="break-words text-sm">{row.priority||"Not provided"}</dd></div>
            <div className="min-w-0 md:col-span-2"><dt className="text-xs font-semibold text-slate-500">Title</dt><dd className="break-words text-sm font-semibold">{row.title||"Not provided"}</dd></div>
            <div className="min-w-0 md:col-span-2"><dt className="text-xs font-semibold text-slate-500">Description</dt><dd data-testid="requirement-import-row-description" className="whitespace-pre-wrap break-words text-sm">{row.description||"Not provided"}</dd></div>
            <div className="min-w-0 md:col-span-2"><dt className="text-xs font-semibold text-slate-500">Acceptance criteria</dt><dd data-testid="requirement-import-row-criteria" className="whitespace-pre-wrap break-words text-sm">{row.acceptance_criteria||"Not provided"}</dd></div>
          </dl>
          {row.error&&<p role="alert" className="break-words rounded bg-red-50 p-2 text-sm text-red-800">{row.error}</p>}
          {preview.state==="confirmed"&&row.requirement_id&&UUID.test(row.requirement_id)&&
            <Link className="inline-flex rounded bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800"
              href={`/requirements/${encodeURIComponent(row.requirement_id)}`} data-testid="requirement-import-open-requirement">
              View {row.decision==="create"?"imported":"existing"} requirement
            </Link>}
        </article>)}
      </div>
      {preview.state==="confirmed"?<p className="text-sm text-slate-600">You can also use the registry below to find your requirements.</p>:
        <button type="button" data-testid="requirement-import-confirm" onClick={()=>void confirm()}
          disabled={busy||preview.rejected>0}
          className="rounded border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-50">
          Confirm import
        </button>}
      {preview.state==="confirmed"&&<span data-testid="requirement-import-confirm" className="text-sm font-semibold text-emerald-800">Imported</span>}
    </div>}
  </section>;
}
