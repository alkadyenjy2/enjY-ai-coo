import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

interface MasterCheck {
  phase: string;
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

async function runMasterAllPhasesVerification() {
  console.log('================================================================');
  console.log('🏆 GRAND MASTER VERIFICATION PASS: PHASES 1 THROUGH 7');
  console.log('================================================================\n');

  const checks: MasterCheck[] = [];

  async function apiCall(path: string, options?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const json: any = await res.json();
    return { status: res.status, json };
  }

  // Phase 1: Core Integration
  try {
    const h = await apiCall('/api/health');
    checks.push({
      phase: 'Phase 1',
      id: 'P1-CORE',
      name: 'Core Integration & Temporal Engine',
      status: h.status === 200 && h.json.temporalEngineActive ? 'PASS' : 'FAIL',
      details: `Health: 200 OK. Temporal Engine Active: ${h.json.temporalEngineActive}`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 1', id: 'P1-CORE', name: 'Core Integration', status: 'FAIL', details: err.message });
  }

  // Phase 2: Social Media Engine
  try {
    const p2 = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Execute Social Media Research & Campaign Generation',
        tavilyPayload: { query: 'AI Automation Trends 2026', topic: 'AI Automation' }
      })
    });
    checks.push({
      phase: 'Phase 2',
      id: 'P2-SOCIAL',
      name: 'Social Media Engine (Tavily + Gemini + Postiz)',
      status: p2.status === 200 && p2.json.success ? 'PASS' : 'FAIL',
      details: `Execution Result: ${p2.json.finalState?.executionResult}`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 2', id: 'P2-SOCIAL', name: 'Social Engine', status: 'FAIL', details: err.message });
  }

  // Phase 3: Digital Products Engine
  try {
    const p3Whop = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Create Digital Product on Whop',
        whopPayload: { name: 'AI Master Kit', description: 'Complete Kit', priceUSD: 49.00 }
      })
    });
    const p3Stripe = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Create Stripe Checkout',
        stripePayload: { productName: 'AI Master Kit', priceUSD: 49.00 }
      })
    });
    const p3Pass = p3Whop.json.success && p3Stripe.json.success;
    checks.push({
      phase: 'Phase 3',
      id: 'P3-DIGITAL',
      name: 'Digital Products Engine (Whop + Stripe)',
      status: p3Pass ? 'PASS' : 'FAIL',
      details: `Whop ID: ${p3Whop.json.finalState?.whopResult?.id}, Stripe Session: ${p3Stripe.json.finalState?.stripeResult?.sessionId}`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 3', id: 'P3-DIGITAL', name: 'Digital Products Engine', status: 'FAIL', details: err.message });
  }

  // Phase 4: Roofing Leads Engine
  try {
    const p4 = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Scrape and Qualify Roofing Leads',
        roofingPayload: { location: 'Austin, TX', limit: 2 }
      })
    });
    const leads = p4.json.finalState?.roofingLeadsResult || [];
    checks.push({
      phase: 'Phase 4',
      id: 'P4-ROOFING',
      name: 'Roofing Leads Engine (Outscraper + Gemini + GHL)',
      status: p4.json.success && leads.length > 0 ? 'PASS' : 'FAIL',
      details: `Leads Qualified: ${leads.length}. Lead #1: ${leads[0]?.businessName} (Score: ${leads[0]?.qualificationScore})`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 4', id: 'P4-ROOFING', name: 'Roofing Leads Engine', status: 'FAIL', details: err.message });
  }

  // Phase 5: Learning & Trust
  try {
    const p5 = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Record Feedback & Trust Update',
        feedbackPayload: { workflowId: 'GENERAL', userRating: 5, feedbackText: 'Great!', evidenceHash: 'PROOF_1001' }
      })
    });
    checks.push({
      phase: 'Phase 5',
      id: 'P5-LEARNING',
      name: 'Learning & Trust Engine (Feedback + Memory + Optimization)',
      status: p5.json.success ? 'PASS' : 'FAIL',
      details: `Feedback Record ID: ${p5.json.finalState?.feedbackResult?.id}`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 5', id: 'P5-LEARNING', name: 'Learning & Trust Engine', status: 'FAIL', details: err.message });
  }

  // Phase 6: Production & Business Operations
  try {
    const p6 = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Run Operations Audit',
        runOperationsAudit: true
      })
    });
    checks.push({
      phase: 'Phase 6',
      id: 'P6-OPERATIONS',
      name: 'Production & Business Operations (Cost Control + Secrets Audit)',
      status: p6.json.success ? 'PASS' : 'FAIL',
      details: `Budget: $${p6.json.finalState?.operationsAuditResult?.costReport?.monthlyBudgetUSD}, Status: ${p6.json.finalState?.operationsAuditResult?.costReport?.rateLimiterStatus}`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 6', id: 'P6-OPERATIONS', name: 'Operations Engine', status: 'FAIL', details: err.message });
  }

  // Phase 7: Real Credentials & Live Webhooks
  try {
    const p7Matrix = await apiCall('/api/connectors/status');
    const p7StripeWh = await apiCall('/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed', data: { object: { customer_email: 'buyer@ai.com', amount_total: 4900 } } })
    });
    const p7Pass = p7Matrix.status === 200 && p7StripeWh.json.received === true;
    checks.push({
      phase: 'Phase 7',
      id: 'P7-LIVE_CONNECTIONS',
      name: 'Real Credentials, Connector Probes & Webhooks Router',
      status: p7Pass ? 'PASS' : 'FAIL',
      details: `Live Connectors Audited: ${Object.keys(p7Matrix.json.liveConnectors || {}).length}. Stripe Webhook Active: ${p7StripeWh.json.received}`
    });
  } catch (err: any) {
    checks.push({ phase: 'Phase 7', id: 'P7-LIVE_CONNECTIONS', name: 'Live Connections', status: 'FAIL', details: err.message });
  }

  console.log('\n================================================================');
  console.log('📊 GRAND MASTER VERIFICATION EXECUTIVE REPORT');
  console.log('================================================================\n');

  let totalPassed = 0;
  checks.forEach((c) => {
    if (c.status === 'PASS') totalPassed++;
    const icon = c.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${c.phase}] [${c.id}] ${c.name}`);
    console.log(`   Details: ${c.details}`);
    console.log('----------------------------------------------------------------');
  });

  const allPassed = totalPassed === checks.length;
  const outcomeText = allPassed ? 'ALL PHASES 1 THROUGH 7 = PASS' : 'GRAND MASTER VERIFICATION FAIL';
  console.log(`\nFINAL OUTCOME: ${outcomeText} (${totalPassed}/${checks.length} Phases Passed)\n`);

  fs.writeFileSync('./temporal-proof/grand-master-summary.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    outcome: outcomeText,
    passedPhases: totalPassed,
    totalPhases: checks.length,
    checks
  }, null, 2));

  if (!allPassed) process.exit(1);
}

runMasterAllPhasesVerification();
