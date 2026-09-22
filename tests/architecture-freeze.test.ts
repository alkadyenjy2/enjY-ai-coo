import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDirective, verifyEvidence } from '../src/execution/guardrails.ts';


test('canonical router separates planning from execution', async () => {
  const planning = await classifyDirective('Create a plan for the next 7 days');
  assert.equal(planning.intent, 'PLANNING');
  assert.equal(planning.mode, 'PLAN');
  assert.equal(planning.requiresEvidence, false);

  const execution = await classifyDirective('Execute the workflow and send the email');
  assert.equal(execution.mode, 'EXECUTE');
  assert.equal(execution.requiresEvidence, true);
});

test('evidence gate rejects missing execution evidence', async () => {
  const result = await verifyEvidence({ source: 'activity-result' });
  assert.equal(result.verified, false);
  assert.equal(result.proofRecord, 'INVALID_OR_MISSING_EXECUTION_EVIDENCE');
});

test('evidence gate rejects arbitrary fake success text', async () => {
  const result = await verifyEvidence({
    executionResult: 'Executed action for directive: send email',
    evidence: 'VERIFICATION_HASH_OK_9981',
    source: 'activity-result'
  });
  assert.equal(result.verified, false);
  assert.equal(result.proofRecord, 'EVIDENCE_DOES_NOT_MATCH_EXECUTION_RESULT');
});

test('evidence gate accepts the actual activity result and derives proof from it', async () => {
  const executionResult = 'POSTIZ_PUBLISHED:post-123:PUBLISHED';
  const result = await verifyEvidence({
    executionResult,
    source: 'activity-result'
  });
  assert.equal(result.verified, true);
  assert.match(result.proofRecord, /^PROOF_VERIFIED_ACTIVITY_RESULT_/);
  assert.equal(result.source, 'activity-result');
});
