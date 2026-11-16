import {NextResponse} from "next/server";
const BASE=process.env.API_BASE_URL??"http://127.0.0.1:8000";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context={params:Promise<{id:string}>};
export async function GET(_req:Request,{params}:Context){
 const {id}=await params;
 if(!UUID.test(id))return NextResponse.json({error:"Invalid requirement ID"},{status:400});
 try{
  const response=await fetch(BASE+"/api/v1/requirements/"+encodeURIComponent(id)+"/ai-analysis",{cache:"no-store",signal:AbortSignal.timeout(10000)});
  const data=await response.json();
  return NextResponse.json(response.ok?data:{error:data.detail||"History unavailable"},{status:response.status});
 }catch{return NextResponse.json({error:"AI history unavailable"},{status:503});}
}
export async function POST(request:Request,{params}:Context){
 const {id}=await params;
 if(!UUID.test(id))return NextResponse.json({error:"Invalid requirement ID"},{status:400});
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body)||
   Object.keys(body).length!==2||!("consent_to_external_processing" in body)||
   !("confirms_no_sensitive_data" in body)||body.consent_to_external_processing!==true||
   body.confirms_no_sensitive_data!==true){
  return NextResponse.json({error:"Explicit consent and sensitivity confirmation required"},{status:403});
 }
 try{
  const response=await fetch(BASE+"/api/v1/requirements/"+encodeURIComponent(id)+"/ai-analysis",{
   method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   cache:"no-store",signal:AbortSignal.timeout(30000)});
  const data=await response.json();
  return NextResponse.json(response.ok?data:{error:data.detail||"AI unavailable"},{status:response.status});
 }catch{return NextResponse.json({error:"Unknown outcome; check analysis history before retrying"},{status:503});}
}