import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { sign } from "node:crypto";

const configPath = process.env.JARVIS_BROWSER_WORKER_CONFIG || "C:/Users/LTC/.jarvis-browser-worker/config.json";
const config = JSON.parse(readFileSync(configPath, "utf8"));
const privateKey = readFileSync(config.privateKeyPath, "utf8");
const mode = "browser_worker_smoke";
const body = {};
const timestamp = String(Date.now());
const message = timestamp + "\n" + mode + "\n" + JSON.stringify(body);
const signature = sign(null, Buffer.from(message), privateKey).toString("base64");
const response = await fetch(config.gatewayUrl, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    apikey: config.publishableKey,
    "x-jarvis-browser-worker-timestamp": timestamp,
    "x-jarvis-browser-worker-signature": signature,
  },
  body: JSON.stringify({ mode, ...body }),
});
const data = await response.json().catch(() => ({}));
if (response.status !== 400 || data?.error !== "Unknown worker mode") throw new Error("Authenticated gateway probe failed.");
const checks = JSON.parse(execFileSync("bsk", ["doctor", "--json"], { encoding: "utf8" }));
if (!Array.isArray(checks) || checks.some((x) => x.ok !== true)) throw new Error("BrowserSkill doctor failed.");
console.log(JSON.stringify({ browserWorkerAuth: "VERIFIED", gatewayProbe: "HTTP_400_AUTHENTICATED", browserSkillDoctor: "PASS" }));
