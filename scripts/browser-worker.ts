import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { executeBrowserSkill } from "../src/adapters/browserskill.ts";

const configPath=process.env.JARVIS_BROWSER_WORKER_CONFIG||"C:/Users/LTC/.jarvis-browser-worker/config.json";
let localConfig:any={};
try{localConfig=JSON.parse(readFileSync(configPath,"utf8"));}catch{}
const gatewayUrl=(process.env.JARVIS_BROWSER_WORKER_GATEWAY_URL||localConfig.gatewayUrl||"https://aislifqpskbduzvvbepz.supabase.co/functions/v1/ai-core-execution-worker").replace(/\/$/,"");
const publishableKey=process.env.JARVIS_BROWSER_WORKER_PUBLISHABLE_KEY||localConfig.publishableKey||"";
const keyPath=process.env.JARVIS_BROWSER_WORKER_PRIVATE_KEY||"C:/Users/LTC/.jarvis-browser-worker/private-key.pem";
const privateKey=readFileSync(keyPath,"utf8");
const pollMs=Number(process.env.JARVIS_BROWSER_WORKER_POLL_MS||5000);

function headers(mode:string,body:unknown){
 const ts=String(Date.now()); const raw=JSON.stringify(body??{});
 const message=ts+String.fromCharCode(10)+mode+String.fromCharCode(10)+raw;
 const sig=createSign("RSA-SHA256").update(message).sign(privateKey).toString("base64");
 return {"content-type":"application/json","apikey":publishableKey,"x-jarvis-browser-worker-timestamp":ts,"x-jarvis-browser-worker-signature":sig};
}
async function request(mode:string,body:unknown){
 const payload={mode,...(body as any||{})};
 const res=await fetch(gatewayUrl,{method:"POST",headers:headers(mode,payload),body:JSON.stringify(payload)});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error("WORKER_HTTP_"+res.status+":"+(data?.error||"unknown"));
 return data;
}
async function processOne(){
 const claimed=await request("claim_browser",{});
 if(!claimed?.job) return false;
 const job=claimed.job; if(job?.job_id && !job.id) job.id=job.job_id;
 console.log(JSON.stringify({event:"CLAIMED",jobId:job.id}));
 try{
  const payload=job.input_payload||{};
  if(payload.kind!=="browser_execution") throw new Error("UNSUPPORTED_BROWSER_JOB_KIND");
  const result=await executeBrowserSkill(Array.isArray(payload.steps)?payload.steps:[]);
  const body={job_id:job.id,message_id:claimed.message_id,organization_id:job.organization_id,status:result.status==="VERIFIED"?"COMPLETED":"FAILED",current_step:result.status==="VERIFIED"?"VERIFIED":"FAILED",state_history:[...(job.state_history||[]),"BROWSER_EXECUTED",result.status==="VERIFIED"?"VERIFIED":"VERIFICATION_FAILED"],execution_result:{status:result.status,sessionId:result.sessionId,steps:result.steps},evidence_proof:result.evidence,error_code:result.status==="VERIFIED"?null:"BROWSER_EXECUTION_FAILED",error_message:result.error||null};
  const done=await request("complete_browser",body);
  console.log(JSON.stringify({event:"COMPLETED",jobId:job.id,status:done?.job?.status||body.status}));
 }catch(error:any){
  const body={job_id:job.id,message_id:claimed.message_id,organization_id:job.organization_id,status:"FAILED",current_step:"FAILED",state_history:[...(job.state_history||[]),"BROWSER_WORKER_FAILED"],execution_result:{error:String(error?.message||error)},evidence_proof:"Browser worker failed before verified execution.",error_code:"BROWSER_WORKER_FAILED",error_message:String(error?.message||error)};
  try{await request("complete_browser",body);}catch(e){console.error("COMPLETE_FAILED",String(e));}
  console.error("BROWSER_JOB_FAILED",job.id,String(error?.message||error));
 }
 return true;
}
console.log(JSON.stringify({event:"STARTED",gatewayUrl,pollMs,configured:Boolean(publishableKey)}));
while(true){try{await processOne();}catch(e){console.error("POLL_ERROR",String(e));}await new Promise(r=>setTimeout(r,pollMs));}


