import { NextResponse } from "next/server";
const BASE=process.env.API_BASE_URL??"http://127.0.0.1:8000";
export async function POST(request:Request) {
  try {
    const form=await request.formData();
    const file=form.get("file");
    if(!(file instanceof File)||file.size>2*1024*1024) return NextResponse.json({error:"Invalid file or size"},{status:400});
    const response=await fetch(BASE+"/api/v1/imports/preview",{method:"POST",body:form,cache:"no-store",signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    return NextResponse.json(response.ok?data:{error:data.detail||"Preview failed"},{status:response.status});
  } catch {return NextResponse.json({error:"Preview unavailable"},{status:503});}
}
