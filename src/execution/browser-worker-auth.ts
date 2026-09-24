import { verify } from "node:crypto";
import type { Request } from "express";
const BROWSER_WORKER_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAPR36vCz7S0FgqRuyhGQNX/0KNbAdWqC0oARIdeIf8Bk=\n-----END PUBLIC KEY-----';
export function verifyBrowserWorkerRequest(req: Request): boolean {
  const ts=String(req.header("x-jarvis-browser-worker-timestamp")||"").trim();
  const sig=String(req.header("x-jarvis-browser-worker-signature")||"").trim();
  if(!ts||!sig) return false;
  const ms=Number(ts);
  if(!Number.isFinite(ms)||Math.abs(Date.now()-ms)>5*60*1000) return false;
  const body=JSON.stringify(req.body??{});
  const message=ts+"\n"+req.method.toUpperCase()+"\n"+req.path+"\n"+body;
  try { return verify(null,Buffer.from(message),BROWSER_WORKER_PUBLIC_KEY,Buffer.from(sig,"base64")); } catch { return false; }
}
export const BROWSER_WORKER_KEY_ID="fattouh-browser-worker-1";

