import type { MediaArtifactRef, MediaExecutionProvider } from "./media-execution.ts";

const DEFAULT_BASE_URL = "https://api.kolbo.ai";
const POLL_INTERVAL_MS = 8000;
const MAX_POLLS = 90;

type KolboStatus = {
  state?: string;
  result?: { urls?: string[]; duration?: number | string | null; model?: string | null };
  error?: string | null;
  credits_used?: number | null;
};

function getConfig() {
  const apiKey = process.env.KOLBO_API_KEY?.trim();
  if (!apiKey) throw new Error("KOLBO_API_KEY is required for production media execution.");
  const baseUrl = (process.env.KOLBO_API_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  return { apiKey, baseUrl };
}

async function kolboRequest<T>(url: string, init: RequestInit, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || body?.message || "Kolbo API request failed (" + response.status + ").");
  }
  return body as T;
}

async function verifyArtifact(artifact: MediaArtifactRef) {
  const response = await fetch(artifact.url, { method: "HEAD" }).catch(() => null);
  if (!response || !response.ok) {
    return { passed: false, checks: ["artifact_exists"], details: "Artifact URL is not reachable (HTTP " + (response?.status ?? "unknown") + ")." };
  }
  const contentType = response.headers.get("content-type") || "";
  const contentLength = Number(response.headers.get("content-length") || "0");
  const checks = ["artifact_exists", "artifact_reachable", contentType.startsWith("video/") ? "artifact_video_content_type" : "artifact_video_content_type_failed", contentLength > 0 ? "artifact_non_empty" : "artifact_non_empty_failed"];
  const passed = contentType.startsWith("video/") && contentLength > 0;
  return { passed, checks, details: passed ? "Verified " + contentType + ", " + contentLength + " bytes." : "Unexpected artifact metadata: content-type=" + (contentType || "missing") + ", content-length=" + contentLength + "." };
}

export async function startKolboMediaJob(request: Parameters<MediaExecutionProvider["execute"]>[0]) {
  if (request.operation !== "lighting") throw new Error("Kolbo provider does not support operation: " + request.operation);
  const { apiKey, baseUrl } = getConfig();
  const started = await kolboRequest<{ generation_id?: string; poll_interval_hint?: number; credits_charged?: number | null }>(
    baseUrl + "/api/v1/edit/video",
    { method: "POST", body: JSON.stringify({ video_url: request.sourceArtifactUrl, operation: "magic_edit", prompt: "Make the lighting darker and more cinematic. Keep everything else the same." }) },
    apiKey,
  );
  if (!started.generation_id) throw new Error("Kolbo did not return generation_id.");
  return { providerJobId: started.generation_id, pollIntervalMs: Math.max(4000, Math.min(15000, Number(started.poll_interval_hint || 8) * 1000)) };
}

export async function pollKolboMediaJob(providerJobId: string) {
  const { apiKey, baseUrl } = getConfig();
  const status = await kolboRequest<KolboStatus>(baseUrl + "/api/v1/generate/" + encodeURIComponent(providerJobId) + "/status", { method: "GET" }, apiKey);
  if (status.state === "completed") {
    const url = status.result?.urls?.[0];
    if (!url) throw new Error("Kolbo completed without an output artifact URL.");
    return { state: "SUCCEEDED" as const, outputArtifact: { url, contentType: "video/mp4" } };
  }
  if (status.state === "failed" || status.state === "cancelled") {
    return { state: "FAILED" as const, error: status.error || "Kolbo generation " + status.state + "." };
  }
  return { state: "RUNNING" as const };
}

export async function verifyKolboArtifact(artifact: MediaArtifactRef) {
  return verifyArtifact(artifact);
}

export const kolboMediaExecutionProvider: MediaExecutionProvider = {
  name: "kolbo",
  async execute(request) {
    const started = await startKolboMediaJob(request);
    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, started.pollIntervalMs));
      const result = await pollKolboMediaJob(started.providerJobId);
      if (result.state === "SUCCEEDED") return { providerJobId: started.providerJobId, outputArtifact: result.outputArtifact };
      if (result.state === "FAILED") throw new Error(result.error);
    }
    throw new Error("Kolbo generation polling timed out before completion.");
  },
  verify: async (_request, artifact) => verifyArtifact(artifact),
};
