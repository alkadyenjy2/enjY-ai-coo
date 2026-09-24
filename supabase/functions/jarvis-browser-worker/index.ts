import { createClient } from "npm:@supabase/supabase-js@2";

const PUBLIC_KEY_PEM=`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA3apNo26X84TdhfmbpETxLbnc9x5MycBqnP3iij7epQc=
-----END PUBLIC KEY-----`;

const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});

function pemBytes(pem:string){
  const base64=pem.replace(/-----[^-]+-----/g,"").replace(/\s+/g,"");
  const binary=atob(base64);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}

let cachedPublicKey:CryptoKey|null=null;
async function getPublicKey(){
  if(!cachedPublicKey){
    cachedPublicKey=await crypto.subtle.importKey("spki",pemBytes(PUBLIC_KEY_PEM),{name:"Ed25519"},false,["verify"]);
  }
  return cachedPublicKey;
}

async function verifyWorker(req:Request,body:any){
  const timestamp=String(req.headers.get("x-jarvis-browser-worker-timestamp")||"").trim();
  const signature=String(req.headers.get("x-jarvis-browser-worker-signature")||"").trim();
  const mode=String(body?.mode||"");
  const timestampMs=Number(timestamp);
  if(!timestamp||!signature||!mode||!Number.isFinite(timestampMs)||Math.abs(Date.now()-timestampMs)>5*60*1000)return false;
  const unsigned={...body};
  delete unsigned.mode;
  const raw=JSON.stringify(unsigned);
  const message=timestamp+"\n"+mode+"\n"+raw;
  try{
    return await crypto.subtle.verify(
      {name:"Ed25519"},
      await getPublicKey(),
      pemBytes("-----BEGIN PUBLIC KEY-----\n"+signature+"\n-----END PUBLIC KEY-----"),
      new TextEncoder().encode(message),
    );
  }catch{
    try{
      const binary=atob(signature);
      const sig=Uint8Array.from(binary,c=>c.charCodeAt(0));
      return await crypto.subtle.verify({name:"Ed25519"},await getPublicKey(),sig,new TextEncoder().encode(message));
    }catch{return false;}
  }
}

Deno.serve(async(req)=>{
  const rawBody=await req.text();
  let body:any={};
  try{body=rawBody?JSON.parse(rawBody):{};}catch{return json({success:false,error:"Invalid JSON body"},400);}
  if(!(await verifyWorker(req,body)))return json({success:false,error:"Invalid browser worker authentication"},401);

  let secretKey="";
  try{secretKey=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"")?.default||"";}catch{}
  if(!secretKey)secretKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  if(!supabaseUrl||!secretKey)return json({success:false,error:"SUPABASE_ADMIN_CONFIG_MISSING"},500);

  const db=createClient(supabaseUrl,secretKey,{auth:{autoRefreshToken:false,persistSession:false}});

  if(body.mode==="claim_browser"){
    const {data,error}=await db.rpc("ai_core_browser_job_claim",{p_visibility_seconds:300});
    if(error)return json({success:false,error:error.message},500);
    const job=Array.isArray(data)?data[0]:data;
    return json({success:true,message_id:job?.message_id??null,job:job??null});
  }

  if(body.mode==="complete_browser"){
    const jobId=String(body.job_id||"").trim();
    const organizationId=String(body.organization_id||"").trim();
    const messageId=Number(body.message_id);
    if(!jobId||!organizationId||!Number.isFinite(messageId))return json({success:false,error:"job_id, organization_id and message_id are required"},400);

    const {data:job,error:readError}=await db.from("ai_core_jobs").select("*").eq("id",jobId).eq("organization_id",organizationId).maybeSingle();
    if(readError)return json({success:false,error:readError.message},500);
    if(!job)return json({success:false,error:"Execution not found"},404);

    const status=body.status==="COMPLETED"?"COMPLETED":"FAILED";
    const {data:updated,error:updateError}=await db.from("ai_core_jobs").update({
      status,
      current_step:String(body.current_step||"FAILED"),
      state_history:Array.isArray(body.state_history)?body.state_history:["FAILED"],
      execution_result:body.execution_result??null,
      evidence_proof:typeof body.evidence_proof==="string"?body.evidence_proof:null,
      error_code:body.error_code||null,
      error_message:body.error_message||null,
      completed_at:new Date().toISOString(),
      updated_at:new Date().toISOString(),
    }).eq("id",jobId).eq("organization_id",organizationId).select("*").single();
    if(updateError)return json({success:false,error:updateError.message},500);

    const {error:deleteError}=await db.rpc("ai_core_browser_job_delete_message",{p_message_id:messageId});
    if(deleteError)return json({success:false,error:deleteError.message},500);

    const {error:auditError}=await db.from("audit_logs").insert({
      organization_id:job.organization_id,
      user_id:job.user_id,
      title:"AI CORE BROWSER - "+status,
      description:"BrowserSkill durable execution completed by Windows worker.",
      type:"ai_core_execution",
      status:status==="COMPLETED"?"success":"failed",
      risk_level:"low",
      event_metadata:{job_id:job.id,worker:"fattouh-browser-worker-1",evidence:updated.evidence_proof},
      workflow_name:"Core AI Agent",
      execution_id:job.id,
      provider:"browserskill",
      error_code:updated.error_code,
      error_message:updated.error_message,
      completed_at:updated.completed_at,
    });
    if(auditError)return json({success:false,error:"AUDIT_LOG_WRITE_FAILED:"+auditError.message},500);
    return json({success:status==="COMPLETED",job:updated});
  }

  return json({success:false,error:"Unknown worker mode"},400);
});