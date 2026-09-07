import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  ApplicationFailure
} from '@temporalio/workflow';
import type * as activities from './activities';

const {
  classifyDirectiveActivity,
  executeDeterministicActivity,
  verifyEvidenceActivity,
  recordMemoryActivity,
  postizPublishActivity,
  whopCreateProductActivity,
  tavilyResearchActivity,
  geminiGenerateContentActivity,
  stripeCheckoutActivity,
  outscraperRoofingLeadsActivity,
  geminiQualifyLeadsActivity,
  ghlDeliverLeadActivity,
  memoryRecordFeedbackActivity,
  memoryOptimizePromptActivity,
  operationsAuditActivity,
  browserUseExecuteActivity
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
  retry: {
    initialInterval: '100 milliseconds',
    maximumInterval: '1 second',
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['POLICY_BREACH']
  }
});

export interface WorkflowInput {
  testId?: string;
  command: string;
  failAttempts?: number;
  nonRetryableError?: boolean;
  requireHumanApproval?: boolean;
  requireEvidence?: boolean;
  provideEvidence?: boolean;
  evidenceText?: string;
  maxLoopIterations?: number;
  browserUsePayload?: { task: string };
  postizPayload?: {
    title?: string;
    content: string;
    platforms: string[];
    scheduledAt?: string;
    mediaUrls?: string[];
  };
  whopPayload?: {
    name: string;
    description: string;
    priceUSD: number;
    productType?: 'DIGITAL_DOWNLOAD' | 'MEMBERSHIP' | 'COURSE' | 'SERVICE';
    redirectUrl?: string;
  };
  tavilyPayload?: {
    query: string;
    topic: string;
  };
  stripePayload?: {
    productName: string;
    priceUSD: number;
    customerEmail?: string;
  };
  roofingPayload?: {
    location: string;
    limit?: number;
  };
  feedbackPayload?: {
    workflowId: string;
    userRating: number;
    feedbackText: string;
    evidenceHash: string;
  };
  optimizePromptPayload?: {
    topic: string;
    basePrompt: string;
  };
  runOperationsAudit?: boolean;
}

export interface CoreState {
  currentStatus: 'RECEIVED' | 'ROUTED' | 'DISPATCHED' | 'WAITING_FOR_APPROVAL' | 'EXECUTED' | 'VERIFIED' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  stateHistory: string[];
  intent?: string;
  executionResult?: string;
  browserUseResult?: any;
  postizResult?: any;
  whopResult?: any;
  tavilyResult?: any;
  stripeResult?: any;
  roofingLeadsResult?: any;
  ghlResult?: any;
  feedbackResult?: any;
  promptOptimizationResult?: any;
  operationsAuditResult?: any;
  approvalStatus: 'AUTO_APPROVED' | 'WAITING' | 'APPROVED' | 'REJECTED';
  verificationStatus: 'NOT_REQUIRED' | 'VERIFIED' | 'FAILED' | 'UNVERIFIED';
  evidenceProof?: string;
  loopIterationsExecuted: number;
  errorDetails?: string;
}

export const humanApprovalSignal = defineSignal<[boolean]>('humanApproval');
export const getCoreStateQuery = defineQuery<CoreState>('getCoreState');

export async function aiCoreRuntimeWorkflow(input: WorkflowInput): Promise<CoreState> {
  const state: CoreState = {
    currentStatus: 'RECEIVED',
    stateHistory: ['RECEIVED'],
    approvalStatus: 'AUTO_APPROVED',
    verificationStatus: 'NOT_REQUIRED',
    loopIterationsExecuted: 0
  };

  let humanApprovedDecision: boolean | null = null;

  setHandler(humanApprovalSignal, (approved: boolean) => {
    humanApprovedDecision = approved;
  });

  setHandler(getCoreStateQuery, () => state);

  function transitionTo(nextStatus: CoreState['currentStatus']) {
    state.currentStatus = nextStatus;
    state.stateHistory.push(nextStatus);
  }

  transitionTo('ROUTED');
  const classification = await classifyDirectiveActivity(input.command);
  state.intent = classification.intent;

  if (input.requireHumanApproval) {
    state.approvalStatus = 'WAITING';
    transitionTo('WAITING_FOR_APPROVAL');
    await condition(() => humanApprovedDecision !== null, '60 seconds');

    if (humanApprovedDecision === true) {
      state.approvalStatus = 'APPROVED';
    } else {
      state.approvalStatus = 'REJECTED';
      transitionTo('REJECTED');
      return state;
    }
  }

  transitionTo('DISPATCHED');
  const maxLoops = input.maxLoopIterations || 1;
  
  while (state.loopIterationsExecuted < maxLoops) {
    state.loopIterationsExecuted++;
    
    try {
      if (input.browserUsePayload) {
        const browserResult = await browserUseExecuteActivity(input.browserUsePayload);
        state.browserUseResult = browserResult;
        state.executionResult = `BROWSER_USE_COMPLETED:${browserResult.sessionId}:${browserResult.status}`;
      } else if (input.postizPayload) {
        const pResult = await postizPublishActivity(input.postizPayload);
        state.postizResult = pResult;
        state.executionResult = `POSTIZ_PUBLISHED:${pResult.id}:${pResult.status}`;
      } else if (input.whopPayload) {
        const wResult = await whopCreateProductActivity(input.whopPayload);
        state.whopResult = wResult;
        state.executionResult = `WHOP_CREATED:${wResult.id}:${wResult.status}`;
      } else if (input.tavilyPayload) {
        const tResult = await tavilyResearchActivity(input.tavilyPayload);
        state.tavilyResult = tResult;
        const generatedText = await geminiGenerateContentActivity(`Synthesize social post for ${input.tavilyPayload.topic} based on research: ${tResult.summary}`);
        state.executionResult = `SOCIAL_ENGINE_RESEARCH_AND_GENERATE:${tResult.query}:${generatedText.slice(0, 40)}...`;
      } else if (input.stripePayload) {
        const sResult = await stripeCheckoutActivity(input.stripePayload);
        state.stripeResult = sResult;
        state.executionResult = `STRIPE_CHECKOUT_CREATED:${sResult.sessionId}:${sResult.paymentStatus}`;
      } else if (input.roofingPayload) {
        const rawLeads = await outscraperRoofingLeadsActivity(input.roofingPayload);
        const qualifiedLeads = await geminiQualifyLeadsActivity(rawLeads);
        state.roofingLeadsResult = qualifiedLeads;
        if (qualifiedLeads.length > 0 && qualifiedLeads[0].qualificationStatus === 'QUALIFIED') {
          const ghlRes = await ghlDeliverLeadActivity(qualifiedLeads[0]);
          state.ghlResult = ghlRes;
        }
        state.executionResult = `ROOFING_ENGINE_LEADS_QUALIFIED:${qualifiedLeads.length}_LEADS`;
      } else if (input.feedbackPayload) {
        const fResult = await memoryRecordFeedbackActivity(input.feedbackPayload);
        state.feedbackResult = fResult;
        state.executionResult = `LEARNING_TRUST_FEEDBACK_RECORDED:${fResult.id}:${fResult.userRating}`;
      } else if (input.optimizePromptPayload) {
        const oResult = await memoryOptimizePromptActivity(input.optimizePromptPayload);
        state.promptOptimizationResult = oResult;
        state.executionResult = `LEARNING_TRUST_PROMPT_OPTIMIZED:${oResult.engineTopic}:SCORE_${oResult.trustScore}`;
      } else if (input.runOperationsAudit) {
        const audit = await operationsAuditActivity();
        state.operationsAuditResult = audit;
        state.executionResult = `OPERATIONS_AUDITED:BUDGET_${audit.costReport.monthlyBudgetUSD}`;
      } else {
        const result = await executeDeterministicActivity({
          command: input.command,
          failAttempts: input.failAttempts,
          nonRetryableError: input.nonRetryableError
        });
        state.executionResult = result.result;
      }
    } catch (err: any) {
      state.errorDetails = err?.message || String(err);
      transitionTo('FAILED');
      return state;
    }
  }

  transitionTo('EXECUTED');

  if (input.requireEvidence === true) {
    const evidenceRes = await verifyEvidenceActivity({
      evidence: input.evidenceText,
      valid: !!input.provideEvidence && !!input.evidenceText
    });

    if (evidenceRes.verified) {
      state.verificationStatus = 'VERIFIED';
      state.evidenceProof = evidenceRes.proofRecord;
      transitionTo('VERIFIED');
    } else {
      state.verificationStatus = 'UNVERIFIED';
      state.errorDetails = 'EVIDENCE_GATE_CHECK_FAILED';
      transitionTo('FAILED');
      return state;
    }
  } else {
    state.verificationStatus = 'NOT_REQUIRED';
    transitionTo('VERIFIED');
  }

  await recordMemoryActivity({
    testId: input.testId,
    finalState: state.currentStatus,
    history: state.stateHistory
  });

  transitionTo('COMPLETED');
  return state;
}
