import type { RouteCandidate } from "./router-types";
import { createEvidenceId, type ResponseEvidence } from "./evidence";

export interface ExecutorRequest {
  prompt: string;
  evidence?: ResponseEvidence;
  systemInstruction?: string;
}

export interface ProviderExecutionResult {
  response: string;
  evidence?: ResponseEvidence;
  providerRequestId?: string;
}

export interface ExecutionAttempt {
  provider: string;
  status: "VERIFIED" | "FAILED";
  latencyMs: number;
  evidence_id?: string;
  error?: string;
}

export interface ExecutorResult {
  response: string;
  provider: string;
  evidence_id: string;
  attempts: ExecutionAttempt[];
  providerRequestId?: string;
}

export type ProviderExecutor = (
  candidate: RouteCandidate,
  request: ExecutorRequest,
) => Promise<ProviderExecutionResult>;

export type EvidenceLogger = (attempt: ExecutionAttempt) => void | Promise<void>;

export class AllProvidersFailedError extends Error {
  readonly attempts: ExecutionAttempt[];

  constructor(attempts: ExecutionAttempt[]) {
    super("ALL_PROVIDERS_FAILED");
    this.name = "AllProvidersFailedError";
    this.attempts = attempts;
  }
}

function envKeyForTool(toolId: string): string {
  const map: Record<string, string> = {
    openrouter: "OPENROUTER_API_KEY",
    "gemini-api": "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    mistral: "MISTRAL_API_KEY",
    cerebras: "CEREBRAS_API_KEY",
    huggingface: "HF_TOKEN",
  };
  return map[toolId] || "";
}

function modelForTool(toolId: string): string {
  const defaults: Record<string, string> = {
    openrouter: "openrouter/free",
    groq: "openai/gpt-oss-120b",
    cerebras: "gpt-oss-120b",
    mistral: "mistral-small-latest",
    huggingface: "openai/gpt-oss-120b:cerebras",
  };
  return process.env[`${toolId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_MODEL`] || defaults[toolId] || "";
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  request: ExecutorRequest,
  headers: Record<string, string> = {},
): Promise<ProviderExecutionResult> {
  const response = await fetch(`${baseUrl.replace(/\/$/u, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(request.systemInstruction
          ? [{ role: "system", content: request.systemInstruction }]
          : []),
        { role: "user", content: request.prompt },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      String(payload?.error?.message || `${response.status} provider error`),
    );
  }

  const text = String(payload?.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("EMPTY_PROVIDER_RESPONSE");

  return {
    response: text,
    evidence: request.evidence,
    providerRequestId: payload?.id ? String(payload.id) : undefined,
  };
}

async function callGemini(request: ExecutorRequest): Promise<ProviderExecutionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    contents: request.prompt,
    config: request.systemInstruction
      ? { systemInstruction: request.systemInstruction }
      : undefined,
  });

  const text = String(response.text || "").trim();
  if (!text) throw new Error("EMPTY_PROVIDER_RESPONSE");

  return { response: text, evidence: request.evidence };
}

export const defaultProviderExecutor: ProviderExecutor = async (candidate, request) => {
  const keyName = envKeyForTool(candidate.toolId);
  const apiKey = keyName ? process.env[keyName]?.trim() : "";
  if (!apiKey) throw new Error(`${keyName || "PROVIDER_API_KEY"}_NOT_CONFIGURED`);

  switch (candidate.toolId) {
    case "openrouter":
      return callOpenAICompatible(
        "https://openrouter.ai/api/v1",
        apiKey,
        modelForTool(candidate.toolId),
        request,
        { "X-Title": "JARVIS AI Gateway" },
      );
    case "groq":
      return callOpenAICompatible("https://api.groq.com/openai/v1", apiKey, modelForTool(candidate.toolId), request);
    case "cerebras":
      return callOpenAICompatible("https://api.cerebras.ai/v1", apiKey, modelForTool(candidate.toolId), request);
    case "mistral":
      return callOpenAICompatible("https://api.mistral.ai/v1", apiKey, modelForTool(candidate.toolId), request);
    case "huggingface":
      return callOpenAICompatible("https://router.huggingface.co/v1", apiKey, modelForTool(candidate.toolId), request);
    case "gemini-api":
      return callGemini(request);
    default:
      throw new Error(`UNSUPPORTED_PROVIDER:${candidate.toolId}`);
  }
};

export async function executeWithFailover(
  candidates: RouteCandidate[],
  request: ExecutorRequest,
  providerExecutor: ProviderExecutor = defaultProviderExecutor,
  logEvidence: EvidenceLogger = () => undefined,
): Promise<ExecutorResult> {
  const attempts: ExecutionAttempt[] = [];

  for (const candidate of candidates) {
    const started = Date.now();
    try {
      const result = await providerExecutor(candidate, request);
      const evidence = result.evidence || request.evidence;
      if (!evidence) throw new Error("EVIDENCE_REQUIRED");

      const evidence_id = createEvidenceId(evidence);
      const attempt: ExecutionAttempt = {
        provider: candidate.toolId,
        status: "VERIFIED",
        latencyMs: Date.now() - started,
        evidence_id,
      };
      attempts.push(attempt);
      await logEvidence(attempt);

      return {
        response: result.response,
        provider: candidate.toolId,
        evidence_id,
        attempts,
        providerRequestId: result.providerRequestId,
      };
    } catch (error) {
      const attempt: ExecutionAttempt = {
        provider: candidate.toolId,
        status: "FAILED",
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      };
      attempts.push(attempt);
      await logEvidence(attempt);
    }
  }

  throw new AllProvidersFailedError(attempts);
}
