import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthoritativelyVerified } from '../src/utils/execution-verification';

test('rejects NOT_REQUIRED as successful verification', () => {
  assert.equal(isAuthoritativelyVerified({
    state_history: ['RECEIVED', 'ROUTED', 'DISPATCHED', 'EXECUTED', 'COMPLETED'],
    evidence: '[Command Router]: classified',
    verificationStatus: 'NOT_REQUIRED',
    errors: [],
    actionsExecuted: [],
  }), false);
});

test('rejects descriptive Gemini evidence without an authoritative verification action', () => {
  assert.equal(isAuthoritativelyVerified({
    state_history: ['RECEIVED', 'ROUTED', 'DISPATCHED', 'EXECUTED', 'VERIFIED'],
    evidence: '[Command Router]: Classified directive | [Gemini Engine]: Executed | [Memory Sync]: Scanned',
    verificationStatus: 'VERIFIED',
    errors: [],
    actionsExecuted: [
      { tool: 'Command Router', status: 'success', details: 'Classified directive' },
      { tool: 'Gemini Engine', status: 'success', details: 'Executed reasoning' },
      { tool: 'Memory Sync', status: 'success', details: 'Scanned memory' },
    ],
  }), false);
});

test('accepts VERIFIED only when an authoritative verification action is present', () => {
  assert.equal(isAuthoritativelyVerified({
    state_history: ['RECEIVED', 'ROUTED', 'DISPATCHED', 'EXECUTED', 'VERIFIED'],
    evidence: '[Gmail Verification Tool]: verified=true',
    verificationStatus: 'VERIFIED',
    errors: [],
    actionsExecuted: [
      { tool: 'Gmail Send Tool', status: 'success', details: 'messageId=abc' },
      { tool: 'Gmail Verification Tool', status: 'success', details: 'verified=true' },
    ],
  }), true);
});
