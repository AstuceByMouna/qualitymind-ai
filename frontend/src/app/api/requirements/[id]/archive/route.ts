import { NextResponse } from "next/server";
const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
type Context = {params: Promise<{id: string}>};
export async function POST(_request: Request, {params}: Context) {
  const {id} = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return NextResponse.json({error:"Invalid ID"}, {status:400});
  try {
    const response = await fetch(BASE + "/api/v1/requirements/" + encodeURIComponent(id) + "/archive", {method:"POST",cache:"no-store",signal:AbortSignal.timeout(10000)});
    const data = await response.json();
    return NextResponse.json(data,{status:response.status});
  } catch {return NextResponse.json({error:"Outcome unknown; refresh before retrying"}, {status:503});}
}
