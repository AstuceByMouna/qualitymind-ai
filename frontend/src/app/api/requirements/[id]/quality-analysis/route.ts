import { NextResponse } from "next/server";
const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = {params: Promise<{id:string}>};

export async function POST(_req: Request, {params}:Context) {
  const {id} = await params;
  if (!UUID.test(id)) return NextResponse.json({error:"Invalid requirement ID"}, {status:400});
  try {
    const response = await fetch(BASE + "/api/v1/requirements/" + encodeURIComponent(id) + "/quality-analysis", {
      method:"POST",cache:"no-store",signal:AbortSignal.timeout(10000)
    });
    if(response.status===404) return NextResponse.json({error:"Requirement not found"}, {status:404});
    if(!response.ok) return NextResponse.json({error:"Analysis service unavailable"}, {status:502});
    const data:unknown = await response.json();
    if(!data || typeof data !== "object" || !("requirement_id" in data) || data.requirement_id!==id || !("findings" in data) || !Array.isArray(data.findings)) {
      return NextResponse.json({error:"Invalid analysis response"}, {status:502});
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({error:"Analysis service unavailable. Try again later."}, {status:503});
  }
}
