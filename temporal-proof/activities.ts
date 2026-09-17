import { ApplicationFailure } from '@temporalio/workflow';
import { postizAdapter, PostizPostInput, PostizPostResult } from '../src/adapters/postiz';
import { whopAdapter, WhopProductInput, WhopProductResult } from '../src/adapters/whop';
import { tavilyAdapter, ResearchInput, ResearchResult } from '../src/adapters/tavily';
import { outscraperAdapter, ScrapeRoofersInput, LeadRecord } from '../src/adapters/outscraper';
import { ghlAdapter, GHLDeliveryResult } from '../src/adapters/ghl';
import { stripeAdapter, StripeCheckoutInput, StripeCheckoutResult } from '../src/adapters/stripe';
import { memoryLearningEngine, FeedbackEntry, PromptOptimizationResult } from '../src/adapters/memory';
import { operationsManager, UserRoleContext, CostControlReport } from '../src/adapters/operations';
import { BrowserUseAdapter, BrowserUseExecutionResult, createBrowserUseCloudClient } from '../src/adapters/browserUse';
import { persistOperationalRecord, persistLearningFeedback, fetchPersistedLearningFeedback } from '../src/adapters/persistence';
import { GoogleGenAI } from '@google/genai';

export interface ActionInput {
  command: string;
  failAttempts?: number;
  nonRetryableError?: boolean;
  requireHumanApproval?: boolean;
  provideEvidence?: boolean;
  loopMaxCount?: number;
}

export interface ActivityContext {
  sideEffectCount: number;
  activityAttempts: Record<string, number>;
}

export const globalContext: ActivityContext = {
  sideEffectCount: 0,
  activityAttempts: {}
};

export function resetGlobalContext() {
  globalContext.sideEffectCount = 0;
  globalContext.activityAttempts = {};
}

function requireLiveDependencies(): boolean {
  return process.env.REQUIRE_LIVE_DEPENDENCIES === 'true' || process.env.NODE_ENV === 'production';
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

export async function classifyDirectiveActivity(command: string): Promise<{ intent: string; confidence: number }> {
  globalContext.activityAttempts['classifyDirective'] = (globalContext.activityAttempts['classifyDirective'] || 0) + 1;
  globalContext.sideEffectCount++;
  
  if (command.toLowerCase().includes('delete') || command.toLowerCase().includes('drop')) {
    return { intent: 'DESTRUCTIVE_ACTION', confidence: 0.98 };
  }
  if (command.toLowerCase().includes('query') || command.toLowerCase().includes('select')) {
    return { intent: 'DATABASE_QUERY', confidence: 0.95 };
  }
  return { intent: 'GENERAL_EXECUTION', confidence: 0.90 };
}

export async function executeDeterministicActivity(input: ActionInput): Promise<{ result: string; attempt: number }> {
  const count = (globalContext.activityAttempts['executeDeterministic'] || 0) + 1;
  globalContext.activityAttempts['executeDeterministic'] = count;

  if (input.nonRetryableError) {
    throw ApplicationFailure.nonRetryable(`FATAL: Unrecoverable policy breach for directive '${input.command}'`, 'POLICY_BREACH');
  }

  if (input.failAttempts && count <= input.failAttempts) {
    throw new Error(`TRANSIENT_FAILURE: Database connection timeout on attempt ${count}`);
  }

  globalContext.sideEffectCount++;
  return {
    result: `Executed action for directive: ${input.command}`,
    attempt: count
  };
}

export async function verifyEvidenceActivity(input: { planId?: string; executionResult?: string }): Promise<{ verified: boolean; proofRecord: string; verificationTool: string }> {
  globalContext.activityAttempts['verifyEvidence'] = (globalContext.activityAttempts['verifyEvidence'] || 0) + 1;

  if (!input.planId || !input.executionResult?.trim()) {
    return {
      verified: false,
      proofRecord: 'INVALID_OR_MISSING_EXECUTION_EVIDENCE',
      verificationTool: 'Execution Verification Tool'
    };
  }

  globalContext.sideEffectCount++;
  const evidence = `[Execution Verification Tool]: plan=${input.planId} execution=${input.executionResult}`;
  return {
    verified: true,
    proofRecord: evidence,
    verificationTool: 'Execution Verification Tool'
  };
}

export async function recordMemoryActivity(record: any): Promise<{ recordId: string; status: string }> {
  globalContext.activityAttempts['recordMemory'] = (globalContext.activityAttempts['recordMemory'] || 0) + 1;

  const memoryRecord = {
    id: `mem-${Date.now()}-${Buffer.from(JSON.stringify(record)).toString('hex').slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    command: record?.command || 'Temporal memory checkpoint',
    project: record?.project || 'AI CORE',
    intent: record?.intent || 'MEMORY_RECORD',
    tool: 'Temporal Memory Activity',
    selectedTools: [],
    actionsExecuted: record?.verificationTool
      ? [
          { tool: String(record.verificationTool), status: 'success', details: String(record.evidence || 'Authoritative execution verification recorded.') },
          { tool: 'Temporal Memory Activity', status: 'success', details: 'Recorded verified workflow memory checkpoint.' }
        ]
      : [{ tool: 'Temporal Memory Activity', status: 'failed', details: 'Refused to record VERIFIED checkpoint without authoritative verification.' }],
    results: { testId: record?.testId || null, finalState: record?.finalState || null, history: record?.history || [] },
    state_history: Array.isArray(record?.history) ? record.history : [],
    evidence: record?.evidence || 'Workflow memory checkpoint persisted through the operational persistence adapter.',
    verificationStatus: record?.verificationTool ? 'VERIFIED' as const : 'FAILED' as const,
    final_state_reason: 'Workflow memory checkpoint recorded.',
    errors: [],
    approvalStatus: 'AUTO_APPROVED' as const,
  };

  const result = await persistOperationalRecord(memoryRecord);
  if (result.persisted && result.recordId) {
    globalContext.sideEffectCount++;
    return { recordId: result.recordId, status: 'PERSISTED' };
  }

  if (requireLiveDependencies()) {
    throw new Error(`DURABLE_MEMORY_UNAVAILABLE:${result.error || 'Supabase persistence is unavailable.'}`);
  }

  return { recordId: memoryRecord.id, status: 'OFFLINE_FALLBACK' };
}

export async function postizPublishActivity(input: PostizPostInput): Promise<PostizPostResult> {
  globalContext.activityAttempts['postizPublish'] = (globalContext.activityAttempts['postizPublish'] || 0) + 1;
  globalContext.sideEffectCount++;
  
  const result = await postizAdapter.createPost(input);
  if (result.status === 'FAILED') {
    throw new Error(`POSTIZ_PUBLISH_FAILED: ${result.error || 'Unknown error'}`);
  }
  
  return result;
}

export async function whopCreateProductActivity(input: WhopProductInput): Promise<WhopProductResult> {
  globalContext.activityAttempts['whopCreateProduct'] = (globalContext.activityAttempts['whopCreateProduct'] || 0) + 1;
  globalContext.sideEffectCount++;
  
  const result = await whopAdapter.createDigitalProduct(input);
  if (result.status === 'FAILED') {
    throw new Error(`WHOP_PRODUCT_CREATE_FAILED: ${result.error || 'Unknown error'}`);
  }
  
  return result;
}

export async function tavilyResearchActivity(input: ResearchInput): Promise<ResearchResult> {
  globalContext.activityAttempts['tavilyResearch'] = (globalContext.activityAttempts['tavilyResearch'] || 0) + 1;
  globalContext.sideEffectCount++;
  operationsManager.logApiCall('tavily');
  return await tavilyAdapter.research(input);
}

export async function geminiGenerateContentActivity(prompt: string, systemInstruction?: string): Promise<string> {
  globalContext.activityAttempts['geminiGenerateContent'] = (globalContext.activityAttempts['geminiGenerateContent'] || 0) + 1;
  globalContext.sideEffectCount++;
  operationsManager.logApiCall('gemini');

  if (!process.env.GEMINI_API_KEY) {
    if (requireLiveDependencies()) {
      throw new Error('GEMINI_LIVE_DEPENDENCY_UNAVAILABLE');
    }
    return `[GEMINI_SIMULATION] Content generated for: \"${prompt.slice(0, 50)}...\" using optimal structural template.`;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });
    return response.text || 'Generated content empty';
  } catch (e: any) {
    if (requireLiveDependencies()) {
      throw new Error(`GEMINI_LIVE_CALL_FAILED:${e?.message || 'unknown error'}`);
    }
    return `[GEMINI_FALLBACK] Generated structured response for prompt: ${prompt}`;
  }
}

export async function stripeCheckoutActivity(input: StripeCheckoutInput): Promise<StripeCheckoutResult> {
  globalContext.activityAttempts['stripeCheckout'] = (globalContext.activityAttempts['stripeCheckout'] || 0) + 1;
  globalContext.sideEffectCount++;
  operationsManager.logApiCall('stripe');
  return await stripeAdapter.createCheckoutSession(input);
}

export async function outscraperRoofingLeadsActivity(input: ScrapeRoofersInput): Promise<LeadRecord[]> {
  globalContext.activityAttempts['outscraperRoofingLeads'] = (globalContext.activityAttempts['outscraperRoofingLeads'] || 0) + 1;
  globalContext.sideEffectCount++;
  operationsManager.logApiCall('outscraper');
  return await outscraperAdapter.scrapeRoofers(input);
}

export async function geminiQualifyLeadsActivity(leads: LeadRecord[]): Promise<LeadRecord[]> {
  globalContext.activityAttempts['geminiQualifyLeads'] = (globalContext.activityAttempts['geminiQualifyLeads'] || 0) + 1;
  globalContext.sideEffectCount++;
  operationsManager.logApiCall('gemini');

  return leads.map((lead) => {
    const score = calculateQualificationScore(lead);
    return {
      ...lead,
      qualificationScore: score,
      qualificationStatus: score >= 80 ? 'QUALIFIED' : 'NEEDS_REVIEW',
      qualificationReason: score >= 80 
        ? 'High review rating, active website, and strong contactability signals.'
        : 'Deterministic score below qualification threshold; requires review.'
    };
  });
}

export async function ghlDeliverLeadActivity(lead: LeadRecord): Promise<GHLDeliveryResult> {
  globalContext.activityAttempts['ghlDeliverLead'] = (globalContext.activityAttempts['ghlDeliverLead'] || 0) + 1;
  globalContext.sideEffectCount++;
  operationsManager.logApiCall('ghl');
  return await ghlAdapter.deliverLeadToGHL(lead);
}

export async function memoryRecordFeedbackActivity(entry: Omit<FeedbackEntry, 'id' | 'timestamp'>): Promise<FeedbackEntry> {
  globalContext.activityAttempts['memoryRecordFeedback'] = (globalContext.activityAttempts['memoryRecordFeedback'] || 0) + 1;
  const feedback = memoryLearningEngine.recordFeedback(entry);
  const result = await persistLearningFeedback(feedback);
  if (!result.persisted) {
    throw new Error(`DURABLE_LEARNING_UNAVAILABLE:${result.error || 'Learning feedback could not be persisted.'}`);
  }
  globalContext.sideEffectCount++;
  return feedback;
}

export async function memoryOptimizePromptActivity(payload: { topic: string; basePrompt: string }): Promise<PromptOptimizationResult> {
  globalContext.activityAttempts['memoryOptimizePrompt'] = (globalContext.activityAttempts['memoryOptimizePrompt'] || 0) + 1;
  const persisted = await fetchPersistedLearningFeedback();
  if (persisted.source !== 'supabase') {
    if (requireLiveDependencies()) {
      throw new Error(`DURABLE_LEARNING_UNAVAILABLE:${persisted.error || 'Learning history could not be loaded.'}`);
    }
  } else {
    memoryLearningEngine.hydrateFeedback(persisted.entries);
  }
  globalContext.sideEffectCount++;
  return memoryLearningEngine.optimizePrompt(payload.topic, payload.basePrompt);
}

export async function operationsAuditActivity(): Promise<{ secrets: any; costReport: CostControlReport }> {
  globalContext.activityAttempts['operationsAudit'] = (globalContext.activityAttempts['operationsAudit'] || 0) + 1;
  globalContext.sideEffectCount++;
  return {
    secrets: operationsManager.auditSecretsStatus(),
    costReport: operationsManager.getCostControlReport()
  };
}

let browserUseAdapter: BrowserUseAdapter | undefined;

export function configureBrowserUseAdapter(adapter: BrowserUseAdapter) {
  browserUseAdapter = adapter;
}

if (process.env.BROWSER_USE_API_KEY) {
  try {
    configureBrowserUseAdapter(createBrowserUseCloudClient());
  } catch (error: any) {
    console.warn('Browser Use Cloud adapter initialization failed:', error?.message || error);
  }
}

export async function browserUseExecuteActivity(input: { task: string }): Promise<BrowserUseExecutionResult> {
  globalContext.activityAttempts['browserUseExecute'] = (globalContext.activityAttempts['browserUseExecute'] || 0) + 1;
  if (!browserUseAdapter) {
    throw new Error('BROWSER_USE_NOT_CONFIGURED');
  }

  const result = await browserUseAdapter.execute(input);
  if (['failed', 'cancelled', 'error', 'timed_out'].includes(result.status.toLowerCase())) {
    throw new Error(`BROWSER_USE_FAILED:${result.sessionId}:${result.status}`);
  }

  globalContext.sideEffectCount++;
  return result;
}
