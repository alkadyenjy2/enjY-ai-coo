import type { MediaArtifactRef, MediaExecutionProvider } from "./media-execution.ts";

const DEFAULT_BASE_URL = "https://api.kolbo.ai";
const POLL_INTERVAL_MS = 4000;
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

export const kolboMediaExecutionProvider: MediaExecutionProvider = {
  name: "kolbo",
  async execute(request) {
    if (request.operation !== "lighting") throw new Error("Kolbo provider does not support operation: " + request.operation);
    const { apiKey, baseUrl } = getConfig();
    const started = await kolboRequest<{ generation_id?: string; poll_interval_hint?: number; credits_charged?: number | null }>(
      baseUrl + "/api/v1/edit/video",
      { method: "POST", body: JSON.stringify({ video_url: request.sourceArtifactUrl, operation: "magic_edit", prompt: "Make the lighting darker and more cinematic. Keep everything else the same." }) },
      apiKey,
    );
    const generationId = started.generation_id;
    if (!generationId) throw new Error("Kolbo did not return generation_id.");
    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      const waitMs = Math.max(1000, Math.min(15000, Number(started.poll_interval_hint || POLL_INTERVAL_MS / 1000) * 1000));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      const status = await kolboRequest<KolboStatus>(baseUrl + "/api/v1/generate/" + encodeURIComponent(generationId) + "/status", { method: "GET" }, apiKey);
      if (status.state === "completed") {
        const url = status.result?.urls?.[0];
        if (!url) throw new Error("Kolbo completed without an output artifact URL.");
        return { providerJobId: generationId, outputArtifact: { url, contentType: "video/mp4" } };
      }
      if (status.state === "failed" || status.state === "cancelled") throw new Error(status.error || "Kolbo generation " + status.state + ".");
    }
    throw new Error("Kolbo generation polling timed out before completion.");
  },
  verify: async (_request, artifact) => verifyArtifact(artifact),
};
