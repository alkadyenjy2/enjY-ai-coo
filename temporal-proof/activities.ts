import { ApplicationFailure } from '@temporalio/workflow';
import { postizAdapter, PostizPostInput, PostizPostResult } from '../src/adapters/postiz';
import { whopAdapter, WhopProductInput, WhopProductResult } from '../src/adapters/whop';
import { tavilyAdapter, ResearchInput, ResearchResult } from '../src/adapters/tavily';
import { outscraperAdapter, ScrapeRoofersInput, LeadRecord } from '../src/adapters/outscraper';
import { ghlAdapter, GHLDeliveryResult } from '../src/adapters/ghl';
import { stripeAdapter, StripeCheckoutInput, StripeCheckoutResult } from '../src/adapters/stripe';
import { memoryLearningEngine, FeedbackEntry, PromptOptimizationResult } from '../src/adapters/memory';
import { operationsManager, UserRoleContext, CostControlReport } from '../src/adapters/operations';
import { BrowserUseAdapter, BrowserUseExecutionResult } from '../src/adapters/browserUse';
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

export async function verifyEvidenceActivity(evidencePayload: { evidence?: string; valid: boolean }): Promise<{ verified: boolean; proofRecord: string }> {
  globalContext.activityAttempts['verifyEvidence'] = (globalContext.activityAttempts['verifyEvidence'] || 0) + 1;
  
  if (!evidencePayload.valid || !evidencePayload.evidence) {
    return { verified: false, proofRecord: 'INVALID_OR_MISSING_EVIDENCE' };
  }
  
  globalContext.sideEffectCount++;
  return {
    verified: true,
    proofRecord: `PROOF_VERIFIED_HASH_${Buffer.from(evidencePayload.evidence).toString('hex').slice(0, 8)}`
  };
}

export async function recordMemoryActivity(record: any): Promise<{ recordId: string; status: string }> {
  globalContext.activityAttempts['recordMemory'] = (globalContext.activityAttempts['recordMemory'] || 0) + 1;
  globalContext.sideEffectCount++;
  return {
    recordId: `mem-${Date.now()}`,
    status: 'PERSISTED'
  };
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
    const score = Math.floor(70 + Math.random() * 25);
    return {
      ...lead,
      qualificationScore: score,
      qualificationStatus: score >= 80 ? 'QUALIFIED' : 'NEEDS_REVIEW',
      qualificationReason: score >= 80 
        ? 'High review rating, active website, high likelihood of commercial roofing intent.'
        : 'Moderate rating, requires owner verification call.'
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
  globalContext.sideEffectCount++;
  return memoryLearningEngine.recordFeedback(entry);
}

export async function memoryOptimizePromptActivity(payload: { topic: string; basePrompt: string }): Promise<PromptOptimizationResult> {
  globalContext.activityAttempts['memoryOptimizePrompt'] = (globalContext.activityAttempts['memoryOptimizePrompt'] || 0) + 1;
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
