import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRouteN8nApproval } from '../src/ai-gateway/n8n-command-policy';

test('read-only system health bypasses the human-approval queue', () => {
  assert.equal(shouldRouteN8nApproval('SYSTEM_HEALTH'), false);
});

test('read-only reporting and scholarship discovery bypass the approval queue', () => {
  assert.equal(shouldRouteN8nApproval('REPORTING'), false);
  assert.equal(shouldRouteN8nApproval('SCHOLARSHIP_DISCOVERY'), false);
});

test('actionable commands remain routed through the existing approval workflow', () => {
  assert.equal(shouldRouteN8nApproval('EXECUTION'), true);
  assert.equal(shouldRouteN8nApproval('DATABASE'), true);
});

test('policy comparison is case-insensitive and whitespace-tolerant', () => {
  assert.equal(shouldRouteN8nApproval(' system_health '), false);
  assert.equal(shouldRouteN8nApproval(' execution '), true);
});
