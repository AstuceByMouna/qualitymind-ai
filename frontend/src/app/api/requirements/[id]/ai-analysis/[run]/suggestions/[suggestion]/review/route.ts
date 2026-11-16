import {NextResponse} from "next/server";
const BASE=process.env.API_BASE_URL??"http://127.0.0.1:8000";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context={params:Promise<{id:string;run:string;suggestion:string}>};
export async function POST(request:Request,{params}:Context){
 const {id,run,suggestion}=await params;
 if(![id,run,suggestion].every(x=>UUID.test(x)))return NextResponse.json({error:"Invalid identifier"},{status:400});
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid review"},{status:400});
 try{
  const response=await fetch(BASE+"/api/v1/requirements/"+encodeURIComponent(id)+"/ai-analysis/"+
    encodeURIComponent(run)+"/suggestions/"+encodeURIComponent(suggestion)+"/review",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
    cache:"no-store",signal:AbortSignal.timeout(12000)});
  const data=await response.json();
  return NextResponse.json(response.ok?data:{error:data.detail||"Review not recorded"},{status:response.status});
 }catch{return NextResponse.json({error:"Review outcome unknown; reload before retrying"},{status:503});}
}