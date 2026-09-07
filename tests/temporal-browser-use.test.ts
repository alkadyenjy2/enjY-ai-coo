import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { BrowserUseAdapter } from '../src/adapters/browserUse';
import { aiCoreRuntimeWorkflow } from '../temporal-proof/workflows';
import * as activities from '../temporal-proof/activities';

test('Browser Use workflow executes through the adapter and Temporal activity', async () => {
  const testEnv = await TestWorkflowEnvironment.createLocal();

  try {
    const browserCalls: string[] = [];
    activities.configureBrowserUseAdapter(new BrowserUseAdapter({
      run: async (task) => {
        browserCalls.push(task);
        return {
          sessionId: 'session-1',
          status: 'completed',
          output: { title: 'Example' },
          evidence: [{ type: 'page', url: 'https://example.com' }]
        };
      }
    }));

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      namespace: testEnv.namespace,
      taskQueue: 'browser-use-contract',
      workflowsPath: path.resolve(process.cwd(), 'temporal-proof/workflows.ts'),
      activities
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
    assert.deepEqual(result.browserUseResult?.output, { title: 'Example' });
  } finally {
    await testEnv.teardown();
  }
});
