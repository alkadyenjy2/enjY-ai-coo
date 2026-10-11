import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfflineFallbackResult } from '../src/execution/offline-fallback';

test('offline fallback reports BLOCKED and never fabricates successful actions', () => {
  const result = createOfflineFallbackResult({
    command: 'Deploy the Roofing project',
    project: 'Roofing AI Operations',
    intent: 'GENERAL_EXECUTION',
    missingDependency: 'GEMINI_LIVE_DEPENDENCY_UNAVAILABLE',
  });

  assert.match(result.content, /Status: BLOCKED/);
  assert.match(result.content, /GEMINI_LIVE_DEPENDENCY_UNAVAILABLE/);
  assert.equal(result.executionRecord.state_history.at(-1), 'BLOCKED');
  assert.deepEqual(result.executionRecord.actionsExecuted, []);
  assert.deepEqual(result.executionRecord.selectedTools, []);
  assert.deepEqual(result.executionRecord.errors, ['GEMINI_LIVE_DEPENDENCY_UNAVAILABLE']);
  assert.equal(result.executionRecord.verificationStatus, 'FAILED');
  assert.equal(result.executionRecord.results.status, 'BLOCKED');
  assert.match(result.executionRecord.evidence, /No external action was attempted/);
  assert.equal(result.executionRecord.approvalStatus, 'REQUIRES_HUMAN_APPROVAL');
  assert.notEqual(result.executionRecord.approvalStatus, 'AUTO_APPROVED');
});

test('offline fallback preserves the real command and project in the audit record', () => {
  const result = createOfflineFallbackResult({
    command: 'Inspect the Vercel deployment blocker',
    project: 'JARVIS',
    intent: 'REPORTING',
    missingDependency: 'PROVIDER_NOT_CONFIGURED',
  });

  assert.equal(result.executionRecord.command, 'Inspect the Vercel deployment blocker');
  assert.equal(result.executionRecord.project, 'JARVIS');
  assert.equal(result.executionRecord.intent, 'REPORTING');
  assert.match(result.executionRecord.final_state_reason, /PROVIDER_NOT_CONFIGURED/);
});
