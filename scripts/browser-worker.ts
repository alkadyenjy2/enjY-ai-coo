import { sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { executeBrowserSkill } from "../src/adapters/browserskill.ts";
const baseUrl=(process.env.JARVIS_BASE_URL||"https://enj-y-ai-coo.vercel.app").replace(/\/$/,"");
const keyPath=process.env.JARVIS_BROWSER_WORKER_PRIVATE_KEY||"C:/Users/LTC/.jarvis-browser-worker/private-key.pem";
const privateKey=readFileSync(keyPath,"utf8");
const pollMs=Number(process.env.JARVIS_BROWSER_WORKER_POLL_MS||5000);
function headers(method:string,path:string,body:unknown){
 const ts=String(Date.now()); const raw=JSON.stringify(body??{}); const message=ts+"\n"+method.toUpperCase()+"\n"+path+"\n"+raw;
 const sig=sign(null,Buffer.from(message),privateKey).toString("base64");
 return {"content-type":"application/json","x-jarvis-browser-worker-timestamp":ts,"x-jarvis-browser-worker-signature":sig};
}
async function request(path:string,body:unknown){
 const res=await fetch(baseUrl+path,{method:"POST",headers:headers("POST",path,body),body:JSON.stringify(body??{})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error("WORKER_HTTP_"+res.status+":"+(data?.error||"unknown"));
 return data;
}
async function processOne(){
 const claimed=await request("/api/executions/browser-worker/claim",{});
 if(!claimed?.job) return false;
 const job=claimed.job;
 console.log(JSON.stringify({event:"CLAIMED",jobId:job.id}));
 try{
  const payload=job.input_payload||{};
  if(payload.kind!=="browser_execution") throw new Error("UNSUPPORTED_BROWSER_JOB_KIND");
  const result=await executeBrowserSkill(Array.isArray(payload.steps)?payload.steps:[]);
  const body={job_id:job.id,message_id:claimed.message_id,organization_id:job.organization_id,status:result.status==="VERIFIED"?"COMPLETED":"FAILED",current_step:result.status==="VERIFIED"?"VERIFIED":"FAILED",state_history:[...(job.state_history||[]),"BROWSER_EXECUTED",result.status==="VERIFIED"?"VERIFIED":"VERIFICATION_FAILED"],execution_result:{status:result.status,sessionId:result.sessionId,steps:result.steps},evidence_proof:result.evidence,error_code:result.status==="VERIFIED"?null:"BROWSER_EXECUTION_FAILED",error_message:result.error||null};
  const done=await request("/api/executions/browser-worker/complete",body);
  console.log(JSON.stringify({event:"COMPLETED",jobId:job.id,status:done?.job?.status||body.status}));
 }catch(error:any){
  const body={job_id:job.id,message_id:claimed.message_id,organization_id:job.organization_id,status:"FAILED",current_step:"FAILED",state_history:[...(job.state_history||[]),"BROWSER_WORKER_FAILED"],execution_result:{error:String(error?.message||error)},evidence_proof:"Browser worker failed before verified execution.",error_code:"BROWSER_WORKER_FAILED",error_message:String(error?.message||error)};
  try{await request("/api/executions/browser-worker/complete",body);}catch(e){console.error("COMPLETE_FAILED",String(e));}
  console.error("BROWSER_JOB_FAILED",job.id,String(error?.message||error));
 }
 return true;
}
console.log(JSON.stringify({event:"STARTED",baseUrl,pollMs}));
if(process.env.JARVIS_BROWSER_WORKER_ONCE==="true"){try{await processOne();}catch(e){console.error("POLL_ERROR",String(e)); process.exitCode=1;}} else {while(true){try{await processOne();}catch(e){console.error("POLL_ERROR",String(e));}await new Promise(r=>setTimeout(r,pollMs));}}


