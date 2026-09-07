import test from 'node:test';
import assert from 'node:assert/strict';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { aiCoreRuntimeWorkflow } from '../temporal-proof/workflows';
import * as activities from '../temporal-proof/activities';

test('Browser Use workflow executes through a Temporal activity and completes with evidence', async () => {
  const testEnv = await TestWorkflowEnvironment.createLocal();

  try {
    const browserCalls: string[] = [];
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      namespace: testEnv.namespace,
      taskQueue: 'browser-use-contract',
      workflowsPath: require.resolve('../temporal-proof/workflows'),
      activities: {
        ...activities,
        browserUseExecuteActivity: async (input: { task: string }) => {
          browserCalls.push(input.task);
          return {
            sessionId: 'session-1',
            status: 'completed',
            output: { title: 'Example' },
            evidence: [{ type: 'page', url: 'https://example.com' }]
          };
        }
      }
    });

    const result = await worker.runUntil(async () => testEnv.client.workflow.execute(aiCoreRuntimeWorkflow, {
      taskQueue: 'browser-use-contract',
      workflowId: 'browser-use-contract-test',
      args: [{
        testId: 'browser-use-contract-test',
        command: 'Open example.com and extract the page title',
        browserUsePayload: { task: 'Open example.com and extract the page title' },
        requireEvidence: true,
        provideEvidence: true,
        evidenceText: 'https://example.com:title=Example'
      }]
    }));

    assert.deepEqual(browserCalls, ['Open example.com and extract the page title']);
    assert.equal(result.currentStatus, 'COMPLETED');
    assert.equal(result.verificationStatus, 'VERIFIED');
    assert.equal(result.executionResult, 'BROWSER_USE_COMPLETED:session-1:completed');
    assert.ok(result.browserUseResult);
  } finally {
    await testEnv.teardown();
  }
});
