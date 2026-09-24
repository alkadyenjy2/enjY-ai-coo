import { sign } from "node:crypto"; import { readFileSync } from "node:fs";
import { verifyBrowserWorkerRequest } from "../src/execution/browser-worker-auth.ts";
const ts=String(Date.now()),body={ping:"ok"},path="/api/executions/browser-worker/claim";
const message=ts+"\nPOST\n"+path+"\n"+JSON.stringify(body);
const sig=sign(null,Buffer.from(message),readFileSync("C:/Users/LTC/.jarvis-browser-worker/private-key.pem")).toString("base64");
const req:any={method:"POST",path,body,header:(n:string)=>({"x-jarvis-browser-worker-timestamp":ts,"x-jarvis-browser-worker-signature":sig}[n])};
console.log("SIGNATURE_VERIFY="+verifyBrowserWorkerRequest(req));


