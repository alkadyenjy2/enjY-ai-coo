import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

interface PhaseResult {
  phase: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
  data?: any;
}

async function runAllPhasesVerification() {
  console.log('================================================================');
  console.log('🚀 MASTER E2E VERIFICATION: ALL 6 ARCHITECTURAL PHASES');
  console.log('================================================================\n');

  const results: PhaseResult[] = [];

  async function apiCall(path: string, options?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const json: any = await res.json();
    return { status: res.status, json };
  }

  // Phase 1: Core Integration
  console.log('▶ [PHASE 1] Core Integration & Temporal Runtime Check...');
  try {
    const health = await apiCall('/api/health');
    const p1Pass = health.status === 200 && health.json.temporalEngineActive === true;
    results.push({
      phase: 'Phase 1',
      name: '🏗️ Core Integration & Temporal Engine',
      status: p1Pass ? 'PASS' : 'FAIL',
      details: p1Pass 
        ? `Temporal Engine ACTIVE. Conformance: ${health.json.conformance}` 
        : `Health check failed: ${JSON.stringify(health.json)}`,
      data: health.json
    });
  } catch (err: any) {
    results.push({
      phase: 'Phase 1',
      name: '🏗️ Core Integration & Temporal Engine',
      status: 'FAIL',
      details: `Exception: ${err.message}`
    });
  }

  // Phase 2: Social Media Engine
  console.log('\n▶ [PHASE 2] Social Media Engine (Tavily Search → Gemini Synthesis → Postiz Dispatch)...');
  try {
    const syncSocialRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Execute Social Media Research & Campaign Generation',
        tavilyPayload: {
          query: 'AI Workflow Automation Best Practices 2026',
          topic: 'AI Workflow Automation'
        }
      })
    });

    const socialState = syncSocialRes.json.finalState;
    const p2Pass = syncSocialRes.status === 200 && 
                   syncSocialRes.json.success && 
                   socialState?.currentStatus === 'COMPLETED' &&
                   !!socialState?.tavilyResult;

    results.push({
      phase: 'Phase 2',
      name: '📱 Social Media Engine',
      status: p2Pass ? 'PASS' : 'FAIL',
      details: p2Pass 
        ? `Tavily Research Completed (${socialState.tavilyResult.sources.length} sources). Gemini Synthesis: "${socialState.executionResult.slice(0, 60)}..."` 
        : `Social engine failed: ${JSON.stringify(syncSocialRes.json)}`,
      data: socialState
    });
  } catch (err: any) {
    results.push({
      phase: 'Phase 2',
      name: '📱 Social Media Engine',
      status: 'FAIL',
      details: `Exception: ${err.message}`
    });
  }

  // Phase 3: Digital Products Engine
  console.log('\n▶ [PHASE 3] Digital Products Engine (Research → Whop Product Creation → Stripe Checkout)...');
  try {
    const whopRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Create Digital Product on Whop',
        whopPayload: {
          name: 'AI Agent Architect Playbook',
          description: 'Production-ready templates for Temporal & Gemini agent pipelines.',
          priceUSD: 79.00,
          productType: 'DIGITAL_DOWNLOAD'
        }
      })
    });

    const stripeRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Generate Stripe Checkout Session',
        stripePayload: {
          productName: 'AI Agent Architect Playbook',
          priceUSD: 79.00,
          customerEmail: 'buyer@example.com'
        }
      })
    });

    const whopState = whopRes.json.finalState;
    const stripeState = stripeRes.json.finalState;

    const p3Pass = whopState?.currentStatus === 'COMPLETED' && 
                   !!whopState?.whopResult?.id && 
                   stripeState?.currentStatus === 'COMPLETED' &&
                   !!stripeState?.stripeResult?.sessionId;

    results.push({
      phase: 'Phase 3',
      name: '💰 Digital Products Engine',
      status: p3Pass ? 'PASS' : 'FAIL',
      details: p3Pass 
        ? `Whop Product Created ID: ${whopState.whopResult.id}. Stripe Session ID: ${stripeState.stripeResult.sessionId}. Checkout URL: ${stripeState.stripeResult.checkoutUrl}` 
        : `Digital products engine failed`,
      data: { whop: whopState, stripe: stripeState }
    });
  } catch (err: any) {
    results.push({
      phase: 'Phase 3',
      name: '💰 Digital Products Engine',
      status: 'FAIL',
      details: `Exception: ${err.message}`
    });
  }

  // Phase 4: Roofing Leads Engine
  console.log('\n▶ [PHASE 4] Roofing Leads Engine (Outscraper → Gemini Qualification → GoHighLevel Delivery)...');
  try {
    const roofingRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Scrape, Qualify, and Deliver Commercial Roofing Leads',
        roofingPayload: {
          location: 'Dallas, TX',
          limit: 3
        }
      })
    });

    const roofingState = roofingRes.json.finalState;
    const leads = roofingState?.roofingLeadsResult || [];
    const ghlRes = roofingState?.ghlResult;

    const p4Pass = roofingState?.currentStatus === 'COMPLETED' && 
                   Array.isArray(leads) && 
                   leads.length > 0 && 
                   !!ghlRes?.contactId;

    results.push({
      phase: 'Phase 4',
      name: '🏠 Roofing Leads Engine',
      status: p4Pass ? 'PASS' : 'FAIL',
      details: p4Pass 
        ? `Scraped ${leads.length} contractors. Lead #1 (${leads[0].businessName}) Qualified (Score: ${leads[0].qualificationScore}/100) → Delivered to GHL (Contact ID: ${ghlRes.contactId}, Stage: ${ghlRes.pipelineStage})` 
        : `Roofing engine failed: ${JSON.stringify(roofingRes.json)}`,
      data: roofingState
    });
  } catch (err: any) {
    results.push({
      phase: 'Phase 4',
      name: '🏠 Roofing Leads Engine',
      status: 'FAIL',
      details: `Exception: ${err.message}`
    });
  }

  // Phase 5: Learning & Trust Engine
  console.log('\n▶ [PHASE 5] Learning & Trust Engine (Evidence → Feedback Store → Prompt Optimization)...');
  try {
    const feedbackRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Record User Feedback & Quality Score',
        feedbackPayload: {
          workflowId: 'ROOFING_LEADS',
          userRating: 5,
          feedbackText: 'Outstanding lead qualification precision!',
          evidenceHash: 'HASH_PROOF_9981'
        }
      })
    });

    const optimizeRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Optimize System Prompt Weights',
        optimizePromptPayload: {
          topic: 'ROOFING_LEADS',
          basePrompt: 'You are a roofing lead qualification agent.'
        }
      })
    });

    const fbState = feedbackRes.json.finalState;
    const optState = optimizeRes.json.finalState;

    const p5Pass = fbState?.currentStatus === 'COMPLETED' && 
                   !!fbState?.feedbackResult?.id && 
                   optState?.currentStatus === 'COMPLETED' &&
                   !!optState?.promptOptimizationResult?.trustScore;

    results.push({
      phase: 'Phase 5',
      name: '🧠 Learning & Trust Engine',
      status: p5Pass ? 'PASS' : 'FAIL',
      details: p5Pass 
        ? `Feedback Recorded ID: ${fbState.feedbackResult.id} (Rating: ${fbState.feedbackResult.userRating}/5). Prompt Trust Score Updated to ${optState.promptOptimizationResult.trustScore}` 
        : `Learning engine failed`,
      data: { feedback: fbState, optimize: optState }
    });
  } catch (err: any) {
    results.push({
      phase: 'Phase 5',
      name: '🧠 Learning & Trust Engine',
      status: 'FAIL',
      details: `Exception: ${err.message}`
    });
  }

  // Phase 6: Production & Operations
  console.log('\n▶ [PHASE 6] Production & Operations (RBAC Auth → Cost Controls → Secrets Audit → E2E)...');
  try {
    const opsRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Run Operations & Cost Controls Audit',
        runOperationsAudit: true
      })
    });

    const opsState = opsRes.json.finalState;
    const auditData = opsState?.operationsAuditResult;

    const p6Pass = opsState?.currentStatus === 'COMPLETED' && 
                   !!auditData?.costReport && 
                   !!auditData?.secrets;

    results.push({
      phase: 'Phase 6',
      name: '🚀 Production & Business Operations',
      status: p6Pass ? 'PASS' : 'FAIL',
      details: p6Pass 
        ? `Audit Completed. Budget: $${auditData.costReport.monthlyBudgetUSD}, Spend: $${auditData.costReport.currentSpendUSD}, Limiter Status: ${auditData.costReport.rateLimiterStatus}, Secrets Audited: ${Object.keys(auditData.secrets).length} keys` 
        : `Operations audit failed`,
      data: opsState
    });
  } catch (err: any) {
    results.push({
      phase: 'Phase 6',
      name: '🚀 Production & Business Operations',
      status: 'FAIL',
      details: `Exception: ${err.message}`
    });
  }

  console.log('\n================================================================');
  console.log('📊 ALL 6 ARCHITECTURAL PHASES - EXECUTIVE SUMMARY');
  console.log('================================================================\n');

  let passedCount = 0;
  results.forEach((r) => {
    if (r.status === 'PASS') passedCount++;
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.phase}] ${r.name}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Details: ${r.details}`);
    console.log('----------------------------------------------------------------');
  });

  const allPassed = passedCount === results.length;
  const outcomeText = allPassed 
    ? 'AI CORE ALL PHASES INTEGRATION = PASS' 
    : 'AI CORE INTEGRATION DEFECT';

  console.log(`\nFINAL OUTCOME: ${outcomeText} (${passedCount}/${results.length} Phases Passed)\n`);

  fs.writeFileSync('./temporal-proof/all-phases-summary.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    outcome: outcomeText,
    totalPhases: results.length,
    passedPhases: passedCount,
    phases: results
  }, null, 2));

  if (!allPassed) {
    process.exit(1);
  }
}

runAllPhasesVerification();
