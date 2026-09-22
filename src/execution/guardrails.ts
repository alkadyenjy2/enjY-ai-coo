import { GoogleGenAI } from "@google/genai";
import { persistOperationalRecord } from "../adapters/persistence";
import { operationsManager } from "../adapters/operations";
import type { LeadRecord } from "../adapters/outscraper";

export type CanonicalIntentMode = "PLAN" | "EXECUTE" | "REPORT" | "QUERY";

export interface CanonicalDirective {
  intent: string;
  confidence: number;
  mode: CanonicalIntentMode;
  requiresApproval: boolean;
  requiresEvidence: boolean;
}

export function classifyDirective(command: string): CanonicalDirective {
  const normalized = command.toLowerCase().trim();
  const destructive = /\b(delete|drop|destroy|remove|purge)\b|حذف|امسح|احذف/.test(normalized);
  const query = /\b(query|select|lookup|read|list|show)\b|استعلام|اقرأ|اعرض|قائمة/.test(normalized);
  const report = /\b(report|summary|status|briefing)\b|تقرير|ملخص|حالة/.test(normalized);
  const planning = /\b(plan|planning|roadmap|strategy)\b|خطة|استراتيجية|خارطة طريق/.test(normalized);
  const explicitExecute = /\b(execute|run|send|update|create|publish|deploy)\b|نفذ|شغل|ارسل|حدّث|أنشئ|انشر/.test(normalized);

  if (destructive) return { intent: "DESTRUCTIVE_ACTION", confidence: 0.99, mode: "EXECUTE", requiresApproval: true, requiresEvidence: true };
  if (planning) return { intent: "PLANNING", confidence: 0.99, mode: "PLAN", requiresApproval: false, requiresEvidence: false };
  if (report) return { intent: "REPORTING", confidence: 0.96, mode: "REPORT", requiresApproval: false, requiresEvidence: true };
  if (query) return { intent: "DATABASE_QUERY", confidence: 0.96, mode: "QUERY", requiresApproval: false, requiresEvidence: true };
  if (explicitExecute) return { intent: "GENERAL_EXECUTION", confidence: 0.93, mode: "EXECUTE", requiresApproval: false, requiresEvidence: true };
  return { intent: "GENERAL_EXECUTION", confidence: 0.80, mode: "EXECUTE", requiresApproval: false, requiresEvidence: true };
}

export function calculateQualificationScore(lead: LeadRecord): number {
  const rating = Math.max(0, Math.min(5, Number(lead.rating || 0)));
  const reviews = Math.max(0, Number(lead.reviewCount || 0));
  const ratingSignal = Math.round(rating * 10);
  const reviewSignal = Math.min(15, Math.floor(Math.log10(reviews + 1) * 6));
  const websiteSignal = lead.website?.trim() ? 10 : 0;
  const contactSignal = lead.phone?.trim() || lead.email?.trim() ? 10 : 0;
  return Math.max(0, Math.min(100, ratingSignal + reviewSignal + websiteSignal + contactSignal));
}

export interface EvidenceVerificationInput {
  executionResult?: string;
  evidence?: string;
  source?: "activity-result" | "independent-verification";
}

export async function verifyEvidence(
  evidencePayload: EvidenceVerificationInput,
): Promise<{ verified: boolean; proofRecord: string; source?: string }> {
  const executionResult = evidencePayload.executionResult?.trim();
  const evidence = evidencePayload.evidence?.trim();
  const source = evidencePayload.source;

  if (!executionResult || !source || !["activity-result", "independent-verification"].includes(source)) {
    return { verified: false, proofRecord: "INVALID_OR_MISSING_EXECUTION_EVIDENCE", source };
  }
  if (/\b(FAILED|ERROR|UNAVAILABLE|CANCELLED|TIMED_OUT)\b/i.test(executionResult)) {
    return { verified: false, proofRecord: "EXECUTION_RESULT_NOT_SUCCESSFUL", source };
  }
  if (evidence && evidence !== executionResult) {
    return { verified: false, proofRecord: "EVIDENCE_DOES_NOT_MATCH_EXECUTION_RESULT", source };
  }

  return {
    verified: true,
    proofRecord: `PROOF_VERIFIED_ACTIVITY_RESULT_${Buffer.from(JSON.stringify({ executionResult, source })).toString("hex").slice(0, 16)}`,
    source,
  };
}

function requireLiveDependencies(): boolean {
  return process.env.REQUIRE_LIVE_DEPENDENCIES === "true" || process.env.NODE_ENV === "production";
}

export async function executeDeterministicActivity(input: { command: string; failAttempts?: number; nonRetryableError?: boolean }): Promise<{ result: string; attempt: number }> {
  if (requireLiveDependencies()) throw new Error("DETERMINISTIC_EXECUTION_SIMULATOR_UNAVAILABLE_IN_PRODUCTION");
  if (input.nonRetryableError) throw new Error(`POLICY_BREACH: ${input.command}`);
  return { result: `Executed action for directive: ${input.command}`, attempt: 1 };
}

export async function geminiGenerateContentActivity(prompt: string, systemInstruction?: string): Promise<string> {
  operationsManager.logApiCall("gemini");
  if (!process.env.GEMINI_API_KEY) {
    if (requireLiveDependencies()) throw new Error("GEMINI_LIVE_DEPENDENCY_UNAVAILABLE");
    return `[GEMINI_SIMULATION] Content generated for: "${prompt.slice(0, 50)}..." using optimal structural template.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text || "Generated content empty";
  } catch (error: any) {
    if (requireLiveDependencies()) throw new Error(`GEMINI_LIVE_CALL_FAILED:${error?.message || "unknown error"}`);
    return `[GEMINI_FALLBACK] Generated structured response for prompt: ${prompt}`;
  }
}

export async function recordMemoryActivity(record: any): Promise<{ recordId: string; status: string }> {
  const memoryRecord = {
    id: `mem-${Date.now()}`,
    timestamp: new Date().toISOString(),
    command: record?.command || "AI CORE memory checkpoint",
    project: record?.project || "AI CORE",
    intent: record?.intent || "MEMORY_RECORD",
    tool: "AI CORE Memory",
    selectedTools: [],
    actionsExecuted: [{ tool: "AI CORE Memory", status: "success", details: "Recorded execution checkpoint." }],
    results: { testId: record?.testId || null, finalState: record?.finalState || null, history: record?.history || [] },
    state_history: Array.isArray(record?.history) ? record.history : [],
    evidence: "Execution checkpoint persisted through the operational persistence adapter.",
    verificationStatus: "VERIFIED" as const,
    final_state_reason: "Execution checkpoint recorded.",
    errors: [],
    approvalStatus: "AUTO_APPROVED" as const,
  };
  const result = await persistOperationalRecord(memoryRecord);
  if (result.persisted && result.recordId) return { recordId: result.recordId, status: "PERSISTED" };
  if (requireLiveDependencies()) throw new Error(`DURABLE_MEMORY_UNAVAILABLE:${result.error || "Supabase persistence is unavailable."}`);
  return { recordId: memoryRecord.id, status: "OFFLINE_FALLBACK" };
}
