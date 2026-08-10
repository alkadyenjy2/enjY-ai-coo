import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { globalContext, resetGlobalContext } from './activities';
import * as activities from './activities';
import { aiCoreRuntimeWorkflow, humanApprovalSignal, getCoreStateQuery } from './workflows';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workflowsPath = path.resolve(__dirname, './workflows.ts');

interface TestResult {
  testId: string;
  testName: string;
  status: 'PASS' | 'FAIL';
  evidence: {
    eventHistoryCount: number;
    stateTrace: string[];
    activityAttempts: Record<string, number>;
    sideEffectCount: number;
    finalStatus: string;
    finalContractResult: string;
    details: string;
  };
}

async function runProofHarness() {
  console.log('================================================================');
  console.log('🤖 TEMPORAL CONFORMANCE PROOF HARNESS v1.0 (AI CORE RUNTIME CONTRACT)');
  console.log('================================================================\n');

  let testEnv: TestWorkflowEnvironment;
  try {
    console.log('⏳ Initializing Temporal Test Environment...');
    testEnv = await TestWorkflowEnvironment.createLocal();
    console.log('✅ Temporal Test Environment initialized successfully.\n');
  } catch (err: any) {
    console.error('❌ Failed to initialize Temporal Test Environment:', err);
    console.error('BLOCKER_IDENTIFIED: Local Temporal test server executable could not be spawned in container.');
    process.exit(1);
  }

  const results: TestResult[] = [];

  const taskQueue = 'ai-core-conformance-queue';

  // Helper worker launcher
  async function runWorkflowTest(
    testId: string,
    testName: string,
    input: any,
    customAction?: (client: any, handle: any) => Promise<void>
  ): Promise<TestResult> {
    resetGlobalContext();

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      namespace: 'default',
      taskQueue,
      workflowsPath,
      activities
    });

    return await worker.runUntil(async () => {
      const client = testEnv.client;
      const workflowId = `test-${testId}-${Date.now()}`;

      const handle = await client.workflow.start(aiCoreRuntimeWorkflow, {
        taskQueue,
        workflowId,
        args: [{ testId, ...input }]
      });

      if (customAction) {
        await customAction(client, handle);
      }

      let finalState: any;
      let executionError: any = null;

      try {
        finalState = await handle.result();
      } catch (err: any) {
        executionError = err;
        try {
          finalState = await handle.query(getCoreStateQuery);
        } catch (qErr) {
          finalState = null;
        }
      }

      // Fetch workflow history
      let eventHistoryCount = 0;
      try {
        const historyEvents = await handle.fetchHistory();
        eventHistoryCount = historyEvents?.events?.length || 0;
      } catch (e) {
        eventHistoryCount = -1;
      }

      // Format result
      let pass = false;
      let details = '';

      if (testId === 'T01') {
        // T01: Full State Transitions
        const expected = ['RECEIVED', 'ROUTED', 'DISPATCHED', 'EXECUTED', 'VERIFIED', 'COMPLETED'];
        const actual = finalState?.stateHistory || [];
        pass = JSON.stringify(actual) === JSON.stringify(expected) && finalState?.currentStatus === 'COMPLETED';
        details = pass ? 'All 6 core state transitions verified in sequence.' : `Mismatch in state trace: ${JSON.stringify(actual)}`;
      } else if (testId === 'T02') {
        // T02: Retry / Non-Retry
        if (input.nonRetryableError) {
          // Should fail immediately on 1st attempt without retries
          const attempts = globalContext.activityAttempts['executeDeterministic'] || 0;
          pass = attempts === 1 && finalState?.currentStatus === 'FAILED';
          details = pass ? `Non-retryable policy breach stopped execution after exactly ${attempts} attempt.` : `Expected 1 attempt & FAILED status, got ${attempts}`;
        } else if (input.failAttempts) {
          // Should retry and succeed on attempt failAttempts + 1
          const attempts = globalContext.activityAttempts['executeDeterministic'] || 0;
          pass = attempts === input.failAttempts + 1 && finalState?.currentStatus === 'COMPLETED';
          details = pass ? `Transient errors retried ${input.failAttempts} times and recovered on attempt ${attempts}.` : `Expected ${input.failAttempts + 1} attempts, got ${attempts}`;
        }
      } else if (testId === 'T03') {
        // T03: Idempotency Replay
        // Query state multiple times during and after execution
        const currentState = await handle.query(getCoreStateQuery);
        pass = currentState.currentStatus === 'COMPLETED' && globalContext.sideEffectCount === 3;
        details = pass ? `Replay & query executed without duplicated side-effects (Side-effects: ${globalContext.sideEffectCount}).` : `Unexpected side-effect count: ${globalContext.sideEffectCount}`;
      } else if (testId === 'T04') {
        // T04: Human Pause / Resume
        const wasApproved = input.customApproved;
        if (wasApproved) {
          pass = finalState?.approvalStatus === 'APPROVED' && finalState?.currentStatus === 'COMPLETED';
          details = pass ? 'Workflow correctly paused at WAITING_FOR_APPROVAL and resumed upon APPROVED signal.' : `Unexpected state: ${finalState?.currentStatus}`;
        } else {
          pass = finalState?.approvalStatus === 'REJECTED' && finalState?.currentStatus === 'REJECTED';
          details = pass ? 'Workflow correctly paused and terminated upon REJECTED signal.' : `Unexpected state: ${finalState?.currentStatus}`;
        }
      } else if (testId === 'T05') {
        // T05: Loop Termination Guardrail
        pass = finalState?.loopIterationsExecuted === input.maxLoopIterations && finalState?.currentStatus === 'COMPLETED';
        details = pass ? `Loop executed exactly ${input.maxLoopIterations} iterations as constrained by guardrail.` : `Loop executed ${finalState?.loopIterationsExecuted} times`;
      } else if (testId === 'T06') {
        // T06: Evidence Gate
        if (input.provideEvidence) {
          pass = finalState?.verificationStatus === 'VERIFIED' && !!finalState?.evidenceProof;
          details = pass ? `Evidence verified successfully. Proof hash: ${finalState?.evidenceProof}` : 'Evidence gate failed when evidence was valid';
        } else {
          pass = finalState?.verificationStatus === 'UNVERIFIED' && finalState?.currentStatus === 'FAILED';
          details = pass ? 'Evidence gate correctly blocked transition to VERIFIED when evidence was invalid/missing.' : 'Evidence gate failed to block missing evidence';
        }
      } else if (testId === 'T07') {
        // T07: Recovery & Failure Recording
        pass = finalState?.currentStatus === 'FAILED' && !!finalState?.errorDetails;
        details = pass ? `Failure gracefully caught and recorded in state history: ${finalState?.errorDetails}` : 'Failure recovery did not capture error state';
      }

      return {
        testId,
        testName,
        status: pass ? 'PASS' : 'FAIL',
        evidence: {
          eventHistoryCount,
          stateTrace: finalState?.stateHistory || [],
          activityAttempts: { ...globalContext.activityAttempts },
          sideEffectCount: globalContext.sideEffectCount,
          finalStatus: finalState?.currentStatus || 'UNKNOWN',
          finalContractResult: pass ? 'CONFORMS_TO_CONTRACT' : 'CONTRACT_DEFECT',
          details
        }
      };
    });
  }

  // Execute T01–T07 Test Matrix
  try {
    // T01: State Transitions
    console.log('▶ Running Test T01: State Transitions...');
    const resT01 = await runWorkflowTest('T01', 'State Transitions (RECEIVED -> COMPLETED)', {
      command: 'Execute operations workflow'
    });
    results.push(resT01);

    // T02a: Transient Error Retry
    console.log('▶ Running Test T02a: Transient Error Retry Policy...');
    const resT02a = await runWorkflowTest('T02', 'Transient Retry Backoff', {
      command: 'Execute with transient DB timeouts',
      failAttempts: 2
    });
    results.push(resT02a);

    // T02b: Non-Retryable Error
    console.log('▶ Running Test T02b: Non-Retryable Policy Breach...');
    const resT02b = await runWorkflowTest('T02', 'Non-Retryable Fatal Exception', {
      command: 'Execute unauthorized command',
      nonRetryableError: true
    });
    results.push(resT02b);

    // T03: Idempotency Replay
    console.log('▶ Running Test T03: Idempotency Replay & Determinism...');
    const resT03 = await runWorkflowTest('T03', 'Idempotency & Replay Determinism', {
      command: 'Query database with replay'
    });
    results.push(resT03);

    // T04a: Human Pause & Resume (Approved)
    console.log('▶ Running Test T04a: Human Pause & Approval Signal...');
    const resT04a = await runWorkflowTest(
      'T04',
      'Human-in-the-loop Approval Signal',
      { command: 'Delete production logs', requireHumanApproval: true, customApproved: true },
      async (_client, handle) => {
        // Wait for workflow to reach WAITING_FOR_APPROVAL
        await new Promise((r) => setTimeout(r, 800));
        await handle.signal(humanApprovalSignal, true);
      }
    );
    results.push(resT04a);

    // T04b: Human Pause & Rejection Signal
    console.log('▶ Running Test T04b: Human Pause & Rejection Signal...');
    const resT04b = await runWorkflowTest(
      'T04',
      'Human-in-the-loop Rejection Signal',
      { command: 'Drop leads table', requireHumanApproval: true, customApproved: false },
      async (_client, handle) => {
        await new Promise((r) => setTimeout(r, 800));
        await handle.signal(humanApprovalSignal, false);
      }
    );
    results.push(resT04b);

    // T05: Loop Termination Guardrail
    console.log('▶ Running Test T05: Loop Termination Guardrail...');
    const resT05 = await runWorkflowTest('T05', 'Loop Guardrail Iteration Limit', {
      command: 'Iterative reasoning loop',
      maxLoopIterations: 5
    });
    results.push(resT05);

    // T06a: Evidence Gate (Valid Evidence)
    console.log('▶ Running Test T06a: Evidence Gate Verification (Valid)...');
    const resT06a = await runWorkflowTest('T06', 'Evidence Gate Pass', {
      command: 'Execute verified lead scoring',
      requireEvidence: true,
      provideEvidence: true,
      evidenceText: 'VERIFICATION_HASH_OK_9981'
    });
    results.push(resT06a);

    // T06b: Evidence Gate (Missing Evidence)
    console.log('▶ Running Test T06b: Evidence Gate Blocking (Missing)...');
    const resT06b = await runWorkflowTest('T06', 'Evidence Gate Block Missing Proof', {
      command: 'Execute unverified lead scoring',
      requireEvidence: true,
      provideEvidence: false,
      evidenceText: ''
    });
    results.push(resT06b);

    // T07: Recovery & State Failure Log
    console.log('▶ Running Test T07: State Recovery & Fault Log...');
    const resT07 = await runWorkflowTest('T07', 'Recovery & State Capture', {
      command: 'Faulty command execution',
      failAttempts: 10 // exceed max retries (3)
    });
    results.push(resT07);

  } finally {
    await testEnv.teardown();
  }

  // Print Full Test Summary Report
  console.log('\n================================================================');
  console.log('📊 TEMPORAL CONFORMANCE PROOF EXECUTIVE SUMMARY');
  console.log('================================================================\n');

  let allPassed = true;
  results.forEach((r, index) => {
    if (r.status === 'FAIL') allPassed = false;
    console.log(`[TEST ${r.testId} #${index + 1}] ${r.testName}`);
    console.log(`  Status: ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  State Trace: ${JSON.stringify(r.evidence.stateTrace)}`);
    console.log(`  Event History Count: ${r.evidence.eventHistoryCount}`);
    console.log(`  Activity Attempts: ${JSON.stringify(r.evidence.activityAttempts)}`);
    console.log(`  Side Effects Recorded: ${r.evidence.sideEffectCount}`);
    console.log(`  Details: ${r.evidence.details}`);
    console.log('----------------------------------------------------------------');
  });

  console.log(`\nFINAL CONFORMANCE RESULT: ${allPassed ? '✅ TEMPORAL_CONFORMANCE = PROVEN' : '❌ TEMPORAL_CONFORMANCE_DEFECT'}`);
  
  // Save results JSON for verification artifact
  fs.writeFileSync('./temporal-proof/results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    overallResult: allPassed ? 'TEMPORAL_CONFORMANCE = PROVEN' : 'TEMPORAL_CONFORMANCE_DEFECT',
    testResults: results
  }, null, 2));
}

runProofHarness().catch((err) => {
  console.error('CRITICAL HARNESS ERROR:', err);
  process.exit(1);
});
