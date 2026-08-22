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

async function runPostizWorkflowE2E() {
  console.log('================================================================');
  console.log('🌐 FULL E2E TEST: TEMPORAL WORKFLOW ENGINE → POSTIZ PUBLISH → AUDIT');
  console.log('================================================================\n');

  const results: E2ETestResult[] = [];

  async function callApi(path: string, options?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const json: any = await res.json();
    return { status: res.status, json };
  }

  try {
    // Step 1: Health Check
    console.log('▶ Step 1: Querying Server Health Check (/api/health)...');
    const health = await callApi('/api/health');
    const healthPass = health.status === 200 && health.json.temporalEngineActive === true;
    results.push({
      step: '1. Health Check',
      endpoint: 'GET /api/health',
      status: healthPass ? 'PASS' : 'FAIL',
      details: healthPass ? `Server active. Temporal Engine Active: ${health.json.temporalEngineActive}` : `Unexpected health: ${JSON.stringify(health.json)}`,
      payload: health.json
    });

    // Step 2: Synchronous Temporal Workflow with Postiz Payload
    console.log('▶ Step 2: Executing Sync Temporal Workflow with Postiz Dispatch (/api/temporal/execute-sync)...');
    const syncPostizRes = await callApi('/api/temporal/execute-sync', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Publish Product Announcement via Postiz',
        requireHumanApproval: false,
        postizPayload: {
          title: 'Product Launch v2',
          content: '🚀 Major AI CORE update is live across all platforms!',
          platforms: ['twitter', 'linkedin', 'facebook'],
          scheduledAt: new Date(Date.now() + 3600000).toISOString()
        }
      })
    });

    const syncFinalState = syncPostizRes.json.finalState;
    const syncPass = syncPostizRes.status === 200 && 
                     syncPostizRes.json.success && 
                     syncFinalState?.currentStatus === 'COMPLETED' &&
                     !!syncFinalState?.postizResult?.id &&
                     syncFinalState?.postizResult?.platforms?.includes('twitter');

    results.push({
      step: '2. Synchronous Postiz Execution',
      endpoint: 'POST /api/temporal/execute-sync',
      status: syncPass ? 'PASS' : 'FAIL',
      details: syncPass ? `Workflow executed Postiz publish activity. Post ID: ${syncFinalState.postizResult.id}, Status: ${syncFinalState.postizResult.status}` : `Execution failed: ${JSON.stringify(syncPostizRes.json)}`,
      payload: syncPostizRes.json
    });

    // Step 3: Async Workflow with Human Approval Gate
    console.log('▶ Step 3: Starting Async Temporal Workflow requiring Human Approval (/api/temporal/start)...');
    const asyncStartRes = await callApi('/api/temporal/start', {
      method: 'POST',
      body: JSON.stringify({
        command: 'Approve & Publish Campaign to Postiz',
        requireHumanApproval: true,
        testId: 'POSTIZ_APPROVAL_TEST',
        postizPayload: {
          title: 'Roofing Special Offer',
          content: 'Exclusive 15% discount on commercial roof inspections this month.',
          platforms: ['linkedin', 'twitter']
        }
      })
    });

    const workflowId = asyncStartRes.json.workflowId;
    const asyncStartPass = asyncStartRes.status === 200 && asyncStartRes.json.success && !!workflowId;
    results.push({
      step: '3. Async Postiz Workflow Start',
      endpoint: 'POST /api/temporal/start',
      status: asyncStartPass ? 'PASS' : 'FAIL',
      details: asyncStartPass ? `Async Workflow initiated. Workflow ID: ${workflowId}` : `Start failed: ${JSON.stringify(asyncStartRes.json)}`,
      payload: asyncStartRes.json
    });

    // Step 4: Pause State Check
    console.log(`▶ Step 4: Checking Pause State for ${workflowId} (/api/temporal/status/${workflowId})...`);
    await new Promise((r) => setTimeout(r, 600));
    const statusRes = await callApi(`/api/temporal/status/${workflowId}`);
    const isWaiting = statusRes.json.state?.currentStatus === 'WAITING_FOR_APPROVAL';
    results.push({
      step: '4. Human Approval Pause Check',
      endpoint: `GET /api/temporal/status/${workflowId}`,
      status: isWaiting ? 'PASS' : 'FAIL',
      details: isWaiting ? 'Workflow accurately held in WAITING_FOR_APPROVAL state before Postiz call.' : `Status was ${statusRes.json.state?.currentStatus}`,
      payload: statusRes.json
    });

    // Step 5: Send Approval Signal
    console.log(`▶ Step 5: Signaling Approval to ${workflowId} (/api/temporal/signal/${workflowId})...`);
    const signalRes = await callApi(`/api/temporal/signal/${workflowId}`, {
      method: 'POST',
      body: JSON.stringify({ approved: true })
    });
    const signalPass = signalRes.status === 200 && signalRes.json.success;
    results.push({
      step: '5. Human Approval Signal',
      endpoint: `POST /api/temporal/signal/${workflowId}`,
      status: signalPass ? 'PASS' : 'FAIL',
      details: signalPass ? 'Approval signal registered in Temporal engine.' : `Signal failed: ${JSON.stringify(signalRes.json)}`,
      payload: signalRes.json
    });

    // Step 6: Post-Signal Completion Check
    console.log(`▶ Step 6: Verifying Workflow Completion after Signal (/api/temporal/status/${workflowId})...`);
    await new Promise((r) => setTimeout(r, 800));
    const finalStatusRes = await callApi(`/api/temporal/status/${workflowId}`);
    const postSignalState = finalStatusRes.json.state;
    const postSignalPass = postSignalState?.currentStatus === 'COMPLETED' && !!postSignalState?.postizResult?.id;
    results.push({
      step: '6. Post-Approval Completion & Postiz Result',
      endpoint: `GET /api/temporal/status/${workflowId}`,
      status: postSignalPass ? 'PASS' : 'FAIL',
      details: postSignalPass ? `Workflow resumed and executed Postiz activity. Result ID: ${postSignalState.postizResult.id}` : `Final status was ${postSignalState?.currentStatus}`,
      payload: postSignalState
    });

    // Step 7: Temporal Event History Audit Trail
    console.log(`▶ Step 7: Fetching Temporal Execution History Audit Trail (/api/temporal/history/${workflowId})...`);
    const historyRes = await callApi(`/api/temporal/history/${workflowId}`);
    const historyEvents = historyRes.json.history?.events;
    const historyPass = historyRes.status === 200 && historyRes.json.success && Array.isArray(historyEvents) && historyEvents.length > 0;
    results.push({
      step: '7. Temporal Audit Trail Verification',
      endpoint: `GET /api/temporal/history/${workflowId}`,
      status: historyPass ? 'PASS' : 'FAIL',
      details: historyPass ? `Audit trail captured ${historyEvents.length} full Temporal execution events.` : `History fetch failed: ${JSON.stringify(historyRes.json)}`,
      payload: { eventCount: historyEvents?.length || 0 }
    });

  } catch (err: any) {
    console.error('❌ E2E Execution Error:', err);
    results.push({
      step: 'EXCEPTION',
      endpoint: 'HTTP connection',
      status: 'FAIL',
      details: `Exception caught: ${err?.message || String(err)}`
    });
  }

  console.log('\n================================================================');
  console.log('📊 POSTIZ WORKFLOW E2E EXECUTIVE SUMMARY');
  console.log('================================================================\n');

  let allPass = true;
  results.forEach((r) => {
    if (r.status === 'FAIL') allPass = false;
    console.log(`[${r.step}] ${r.endpoint}`);
    console.log(`  Status: ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Details: ${r.details}`);
    console.log('----------------------------------------------------------------');
  });

  const summaryText = allPass 
    ? '✅ TEMPORAL_POSTIZ_AUDIT_PIPELINE = PROVEN' 
    : '❌ POSTIZ_WORKFLOW_DEFECT';

  console.log(`\nOVERALL E2E RESULT: ${summaryText}`);

  fs.writeFileSync('./temporal-proof/postiz-e2e-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    overallResult: summaryText,
    results
  }, null, 2));
}

runPostizWorkflowE2E();
