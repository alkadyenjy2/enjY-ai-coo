import fetch from 'node-fetch';
import fs from 'fs';
import { postizPublishActivity } from './activities';
import { whopCreateProductActivity } from './activities';
import { postizAdapter } from '../src/adapters/postiz';
import { whopAdapter } from '../src/adapters/whop';

const BASE_URL = 'http://localhost:3000';

interface VerificationCheck {
  id: string;
  name: string;
  category: 'TEMPORAL_CORE' | 'POSTIZ_ADAPTER' | 'WHOP_ADAPTER' | 'AUDIT_TRAIL' | 'EXPRESS_GATEWAY';
  status: 'PASS' | 'FAIL';
  details: string;
}

async function runFullVerificationPass() {
  console.log('================================================================');
  console.log('🛡️ FINAL COMPREHENSIVE VERIFICATION PASS: AI CORE INTEGRATION');
  console.log('================================================================\n');

  const checks: VerificationCheck[] = [];

  async function apiCall(path: string, options?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const json = await res.json();
    return { status: res.status, json };
  }

  // Check 1: Server & Temporal Engine Health
  try {
    console.log('▶ Check 1: Verifying Express Gateway & Temporal Engine Health...');
    const health = await apiCall('/api/health');
    const isHealthy = health.status === 200 && health.json.temporalEngineActive === true;
    checks.push({
      id: 'CHK-01',
      name: 'Express Gateway & Temporal Runtime',
      category: 'EXPRESS_GATEWAY',
      status: isHealthy ? 'PASS' : 'FAIL',
      details: isHealthy ? `Gateway Active. Temporal Engine Active: ${health.json.temporalEngineActive}` : `Unhealthy state: ${JSON.stringify(health.json)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'CHK-01',
      name: 'Express Gateway & Temporal Runtime',
      category: 'EXPRESS_GATEWAY',
      status: 'FAIL',
      details: `Health check error: ${err.message}`
    });
  }

  // Check 2: Targeted Postiz Adapter & Temporal Activity Binding
  try {
    console.log('\n▶ Check 2: Testing Postiz Adapter & Activity Binding...');
    const postizRes = await postizPublishActivity({
      title: 'Verification Post',
      content: 'Final verification pass test post',
      platforms: ['twitter', 'linkedin']
    });
    const postizPass = !!postizRes.id && (postizRes.status === 'SCHEDULED' || postizRes.status === 'PUBLISHED');
    checks.push({
      id: 'CHK-02',
      name: 'Postiz Activity & Adapter Binding',
      category: 'POSTIZ_ADAPTER',
      status: postizPass ? 'PASS' : 'FAIL',
      details: postizPass ? `Postiz Activity Executed. ID: ${postizRes.id}, Status: ${postizRes.status}` : `Failed: ${JSON.stringify(postizRes)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'CHK-02',
      name: 'Postiz Activity & Adapter Binding',
      category: 'POSTIZ_ADAPTER',
      status: 'FAIL',
      details: `Postiz Activity Error: ${err.message}`
    });
  }

  // Check 3: Targeted Whop Adapter, Environment Credential & Activity Binding
  try {
    console.log('\n▶ Check 3: Auditing Whop Credentials & Testing Activity Binding...');
    const whopCredStatus = whopAdapter.getApiKeyStatus();
    const whopRes = await whopCreateProductActivity({
      name: 'AI Core Ultimate Suite',
      description: 'Complete suite with Temporal, Postiz, and Whop integration.',
      priceUSD: 199.00
    });
    const whopPass = !!whopRes.id && (whopRes.status === 'ACTIVE' || whopRes.status === 'DRAFT');
    checks.push({
      id: 'CHK-03',
      name: 'Whop Activity & Credential Verification',
      category: 'WHOP_ADAPTER',
      status: whopPass ? 'PASS' : 'FAIL',
      details: whopPass 
        ? `Whop Activity Executed (Key Present: ${whopCredStatus.present}). ID: ${whopRes.id}, Price: $${whopRes.priceUSD}`
        : `Failed: ${JSON.stringify(whopRes)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'CHK-03',
      name: 'Whop Activity & Credential Verification',
      category: 'WHOP_ADAPTER',
      status: 'FAIL',
      details: `Whop Activity Error: ${err.message}`
    });
  }

  // Check 4: Temporal Core Deterministic Workflow & Loop Execution
  try {
    console.log('\n▶ Check 4: Executing Temporal Core Deterministic Loop Workflow...');
    const syncRes = await apiCall('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Execute Deterministic Verification',
        requireHumanApproval: false
      })
    });
    const syncState = syncRes.json.finalState;
    const corePass = syncRes.status === 200 && syncRes.json.success && syncState?.currentStatus === 'COMPLETED';
    checks.push({
      id: 'CHK-04',
      name: 'Temporal Core Deterministic Workflow',
      category: 'TEMPORAL_CORE',
      status: corePass ? 'PASS' : 'FAIL',
      details: corePass ? `Core Workflow Completed. State History: ${syncState.stateHistory.join(' -> ')}` : `Failed: ${JSON.stringify(syncRes.json)}`
    });
  } catch (err: any) {
    checks.push({
      id: 'CHK-04',
      name: 'Temporal Core Deterministic Workflow',
      category: 'TEMPORAL_CORE',
      status: 'FAIL',
      details: `Core Workflow Error: ${err.message}`
    });
  }

  // Check 5: Whop Workflow Dispatch via Temporal Engine & Human Approval
  try {
    console.log('\n▶ Check 5: Executing Whop Workflow Dispatch with Human Approval...');
    const startRes = await apiCall('/api/temporal/start', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Publish Digital Product on Whop',
        requireHumanApproval: true,
        testId: 'WHOP_APPROVAL_VERIFICATION',
        whopPayload: {
          name: 'Verified Digital Asset',
          description: 'Fully verified via AI CORE pipeline.',
          priceUSD: 29.99
        }
      })
    });

    const wfId = startRes.json.workflowId;
    await new Promise((r) => setTimeout(r, 400));
    
    // Signal approval
    await apiCall(`/api/temporal/signal/${wfId}`, {
      method: 'POST',
      body: JSON.stringify({ approved: true })
    });

    await new Promise((r) => setTimeout(r, 800));
    const finalRes = await apiCall(`/api/temporal/status/${wfId}`);
    const finalState = finalRes.json.state;
    const whopWfPass = finalState?.currentStatus === 'COMPLETED' && !!finalState?.whopResult?.id;

    checks.push({
      id: 'CHK-05',
      name: 'Temporal -> Whop Workflow & Human Approval Gate',
      category: 'WHOP_ADAPTER',
      status: whopWfPass ? 'PASS' : 'FAIL',
      details: whopWfPass ? `Whop Workflow Completed. Product ID: ${finalState.whopResult.id}, Checkout URL: ${finalState.whopResult.checkoutUrl}` : `Failed: ${JSON.stringify(finalState)}`
    });

    // Check 6: Audit Trail & Event History Verification
    console.log(`\n▶ Check 6: Verifying Audit Trail Event History for ${wfId}...`);
    const historyRes = await apiCall(`/api/temporal/history/${wfId}`);
    const events = historyRes.json.history?.events;
    const auditPass = historyRes.status === 200 && Array.isArray(events) && events.length > 0;

    checks.push({
      id: 'CHK-06',
      name: 'Temporal Audit Trail & Execution History',
      category: 'AUDIT_TRAIL',
      status: auditPass ? 'PASS' : 'FAIL',
      details: auditPass ? `Audit Trail Captured ${events.length} immutable execution events.` : `Audit Log Missing: ${JSON.stringify(historyRes.json)}`
    });

  } catch (err: any) {
    checks.push({
      id: 'CHK-05',
      name: 'Temporal -> Whop Workflow & Human Approval Gate',
      category: 'WHOP_ADAPTER',
      status: 'FAIL',
      details: `Whop Workflow Error: ${err.message}`
    });
  }

  // Summary Report Generation
  console.log('\n================================================================');
  console.log('📋 FINAL VERIFICATION PASS EXECUTIVE MATRIX');
  console.log('================================================================\n');

  let totalPass = 0;
  checks.forEach((c) => {
    if (c.status === 'PASS') totalPass++;
    const icon = c.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${c.id}] [${c.category}] ${c.name}`);
    console.log(`   Details: ${c.details}`);
    console.log('----------------------------------------------------------------');
  });

  const allPassed = totalPass === checks.length;
  const finalOutcomeString = allPassed ? 'AI CORE INTEGRATION PASS' : 'AI CORE INTEGRATION FAIL';

  console.log(`\nFINAL OUTCOME: ${finalOutcomeString} (${totalPass}/${checks.length} Checks Passed)\n`);

  fs.writeFileSync('./temporal-proof/final-verification-summary.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    outcome: finalOutcomeString,
    totalChecks: checks.length,
    passedChecks: totalPass,
    matrix: checks
  }, null, 2));

  if (!allPassed) {
    process.exit(1);
  }
}

runFullVerificationPass();
