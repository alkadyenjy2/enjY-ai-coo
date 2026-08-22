import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

interface E2ETestResult {
  step: string;
  endpoint: string;
  status: 'PASS' | 'FAIL';
  details: string;
  payload?: any;
}

async function runRealE2ESuite() {
  console.log('================================================================');
  console.log('🌐 REAL E2E TEST SUITE: EXPRESS SERVER + TEMPORAL WORKFLOW ENGINE');
  console.log('================================================================\n');

  const results: E2ETestResult[] = [];

  // Helper fetch function
  async function callApi(path: string, options?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const json: any = await res.json();
    return { status: res.status, json };
  }

  try {
    // 1. Health Check
    console.log('▶ E2E Step 1: Querying Server Health Check (/api/health)...');
    const health = await callApi('/api/health');
    const healthPass = health.status === 200 && health.json.temporalEngineActive === true;
    results.push({
      step: '1. Health Check',
      endpoint: 'GET /api/health',
      status: healthPass ? 'PASS' : 'FAIL',
      details: healthPass ? `Server alive with Temporal Engine Active: ${health.json.temporalEngineActive}` : `Unexpected response: ${JSON.stringify(health.json)}`,
      payload: health.json
    });

    // 2. Synchronous Workflow Execution
    console.log('▶ E2E Step 2: Executing Synchronous Workflow (/api/temporal/execute-sync)...');
    const syncRes = await callApi('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'E2E Synchronous Execution Command',
        requireHumanApproval: false,
        provideEvidence: true,
        evidenceText: 'E2E_VERIFIED_PROOF_1234'
      })
    });
    const syncPass = syncRes.status === 200 && syncRes.json.success && syncRes.json.finalState?.currentStatus === 'COMPLETED';
    results.push({
      step: '2. Synchronous Execution',
      endpoint: 'POST /api/temporal/execute-sync',
      status: syncPass ? 'PASS' : 'FAIL',
      details: syncPass ? `Workflow executed synchronously to COMPLETED state. Workflow ID: ${syncRes.json.workflowId}` : `Failed: ${JSON.stringify(syncRes.json)}`,
      payload: syncRes.json
    });

    // 3. Async Workflow Start & Human Pause State
    console.log('▶ E2E Step 3: Starting Async Workflow requiring Human Approval (/api/temporal/start)...');
    const asyncStartRes = await callApi('/api/temporal/start', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Delete Production Database Snapshot',
        requireHumanApproval: true,
        testId: 'E2E_HUMAN_APPROVE'
      })
    });

    const workflowId = asyncStartRes.json.workflowId;
    const asyncStartPass = asyncStartRes.status === 200 && asyncStartRes.json.success && !!workflowId;
    results.push({
      step: '3. Async Workflow Start',
      endpoint: 'POST /api/temporal/start',
      status: asyncStartPass ? 'PASS' : 'FAIL',
      details: asyncStartPass ? `Async Workflow started with ID: ${workflowId}` : `Start failed: ${JSON.stringify(asyncStartRes.json)}`,
      payload: asyncStartRes.json
    });

    // 4. Query Pending Status
    console.log(`▶ E2E Step 4: Querying Workflow Status for ${workflowId} (/api/temporal/status/${workflowId})...`);
    await new Promise((r) => setTimeout(r, 600)); // wait for workflow to reach WAITING_FOR_APPROVAL
    const statusRes = await callApi(`/api/temporal/status/${workflowId}`);
    const isWaiting = statusRes.json.state?.currentStatus === 'WAITING_FOR_APPROVAL';
    results.push({
      step: '4. Pause State Check',
      endpoint: `GET /api/temporal/status/${workflowId}`,
      status: isWaiting ? 'PASS' : 'FAIL',
      details: isWaiting ? 'Workflow correctly paused in WAITING_FOR_APPROVAL state.' : `Status was ${statusRes.json.state?.currentStatus}`,
      payload: statusRes.json
    });

    // 5. Send Signal Approval
    console.log(`▶ E2E Step 5: Signaling Approval to Workflow ${workflowId} (/api/temporal/signal/${workflowId})...`);
    const signalRes = await callApi(`/api/temporal/signal/${workflowId}`, {
      method: 'POST',
      body: JSON.stringify({ approved: true })
    });
    const signalPass = signalRes.status === 200 && signalRes.json.success;
    results.push({
      step: '5. Signal Approval',
      endpoint: `POST /api/temporal/signal/${workflowId}`,
      status: signalPass ? 'PASS' : 'FAIL',
      details: signalPass ? 'Signal delivered successfully through Express server endpoint.' : `Signal failed: ${JSON.stringify(signalRes.json)}`,
      payload: signalRes.json
    });

    // 6. Verify Completed Async Workflow Status
    console.log(`▶ E2E Step 6: Verifying Workflow Completion after Signal (/api/temporal/status/${workflowId})...`);
    await new Promise((r) => setTimeout(r, 800));
    const finalStatusRes = await callApi(`/api/temporal/status/${workflowId}`);
    const isCompleted = finalStatusRes.json.state?.currentStatus === 'COMPLETED';
    results.push({
      step: '6. Post-Signal Completion Check',
      endpoint: `GET /api/temporal/status/${workflowId}`,
      status: isCompleted ? 'PASS' : 'FAIL',
      details: isCompleted ? 'Workflow successfully resumed and reached COMPLETED status.' : `Final status was ${finalStatusRes.json.state?.currentStatus}`,
      payload: finalStatusRes.json
    });

    // 7. Temporal Event History
    console.log(`▶ E2E Step 7: Fetching Temporal Execution Event History (/api/temporal/history/${workflowId})...`);
    const historyRes = await callApi(`/api/temporal/history/${workflowId}`);
    const historyPass = historyRes.status === 200 && historyRes.json.success && Array.isArray(historyRes.json.history?.events);
    results.push({
      step: '7. Event History Audit',
      endpoint: `GET /api/temporal/history/${workflowId}`,
      status: historyPass ? 'PASS' : 'FAIL',
      details: historyPass ? `Retrieved ${historyRes.json.history?.events?.length} Temporal event history records.` : `Failed to fetch history: ${JSON.stringify(historyRes.json)}`,
      payload: { eventCount: historyRes.json.history?.events?.length }
    });

  } catch (err: any) {
    console.error('❌ E2E Suite Error:', err);
    results.push({
      step: 'EXCEPTION',
      endpoint: 'HTTP connection',
      status: 'FAIL',
      details: `Exception caught: ${err?.message || String(err)}`
    });
  }

  console.log('\n================================================================');
  console.log('📊 REAL E2E TEST SUITE EXECUTIVE SUMMARY');
  console.log('================================================================\n');

  let allPass = true;
  results.forEach((r) => {
    if (r.status === 'FAIL') allPass = false;
    console.log(`[${r.step}] ${r.endpoint}`);
    console.log(`  Status: ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Details: ${r.details}`);
    console.log('----------------------------------------------------------------');
  });

  console.log(`\nOVERALL REAL E2E RESULT: ${allPass ? '✅ REAL_E2E_TEMPORAL_BINDING = PROVEN' : '❌ E2E_BINDING_DEFECT'}`);

  fs.writeFileSync('./temporal-proof/e2e-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    overallResult: allPass ? 'REAL_E2E_TEMPORAL_BINDING = PROVEN' : 'E2E_BINDING_DEFECT',
    results
  }, null, 2));
}

runRealE2ESuite();
