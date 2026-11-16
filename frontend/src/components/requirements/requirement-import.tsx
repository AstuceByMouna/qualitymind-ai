"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Row = {row:number; external_id:string; title:string; decision:string; error:string|null};
type Preview = {id:string;source_name:string;state:string;accepted:number;rejected:number;ignored:number;rows:Row[]};

export function RequirementImport() {
  const [file,setFile] = useState<File|null>(null);
  const [mapping,setMapping] = useState("{}");
  const [preview,setPreview] = useState<Preview|null>(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const lock = useRef(false);
  const router = useRouter();

  async function run(action:()=>Promise<void>) {
    if(lock.current) return;
    lock.current=true;setBusy(true);setError("");
    try {await action();} catch {setError("Unable to confirm the operation. Check the batch before retrying.");}
    finally {lock.current=false;setBusy(false);}
  }
  async function previewFile(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!file) {setError("Select a CSV or XLSX file.");return;}
    if(file.size>2*1024*1024) {setError("Maximum file size is 2 MiB.");return;}
    try {JSON.parse(mapping);} catch {setError("Mapping must be valid JSON.");return;}
    setPreview(null);
    await run(async()=>{
      const payload=new FormData();payload.set("file",file);payload.set("mapping",mapping);
      const response=await fetch("/api/imports/preview",{method:"POST",body:payload});
      const result=await response.json();
      if(!response.ok) {setError(result.error||"Preview rejected.");return;}
      setPreview(result as Preview);
    });
  }
  async function confirm() {
    if(!preview || preview.rejected || preview.state==="confirmed")return;
    await run(async()=>{
      const response=await fetch("/api/imports/"+encodeURIComponent(preview.id)+"/confirm",{method:"POST"});
      const result=await response.json();
      if(!response.ok || result.id!==preview.id || result.state!=="confirmed") {
        setError(result.error||"Import outcome not verified. Reload batch status before retrying.");
        return;
      }
      setPreview(result as Preview);router.refresh();
    });
  }
  return <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3" aria-label="Requirement import">
    <h3 className="font-semibold">Import requirements (CSV / XLSX)</h3>
    <p className="text-xs text-slate-600">Preview first; no requirements are created before confirmation. Up to 2 MiB and 500 rows.</p>
    <form onSubmit={e=>void previewFile(e)} className="flex flex-wrap gap-3 items-end">
      <label className="text-sm">File
        <input data-testid="requirement-import-file" className="block text-sm" type="file" accept=".csv,.xlsx"
          disabled={busy} onChange={e=>{setPreview(null);setFile(e.target.files?.[0]??null);}}/>
      </label>
      <label className="text-sm">Optional mapping JSON
        <input data-testid="requirement-import-mapping" value={mapping} disabled={busy}
          onChange={e=>setMapping(e.target.value)} className="block border rounded p-2 font-mono text-xs w-64"
          aria-label="Column mapping JSON"/>
      </label>
      <button data-testid="requirement-import-preview" type="submit" disabled={busy||!file}
        className="rounded bg-sky-700 px-3 py-2 text-sm text-white disabled:opacity-50">Preview</button>
    </form>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    {preview && <div className="space-y-3" data-testid="requirement-import-results">
      <p className="text-sm">{preview.state}: {preview.accepted} create / {preview.ignored} ignore / {preview.rejected} reject</p>
      <div className="max-h-56 overflow-auto">
        <table className="w-full text-sm"><thead><tr><th className="text-left">Row</th><th className="text-left">External ID</th><th className="text-left">Title</th><th className="text-left">Decision</th></tr></thead>
          <tbody>{preview.rows.map(r=><tr key={r.row}><td>{r.row}</td><td>{r.external_id}</td><td>{r.title}</td><td>{r.error||r.decision}</td></tr>)}</tbody>
        </table>
      </div>
      <button type="button" data-testid="requirement-import-confirm" onClick={()=>void confirm()}
        disabled={busy||preview.rejected>0||preview.state==="confirmed"}
        className="rounded border border-sky-700 px-3 py-2 text-sm disabled:opacity-50">
        {preview.state==="confirmed"?"Imported":"Confirm import"}
      </button>
    </div>}
  </section>;
}
