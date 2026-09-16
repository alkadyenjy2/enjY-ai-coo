import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLiveFreeRoute } from '../src/ai-gateway/live-free-route';

test('selects the highest-priority configured verified free route', () => {
  const result = resolveLiveFreeRoute({
    OPENROUTER_API_KEY: 'router-key',
    GEMINI_API_KEY: 'gemini-key',
  });

  assert.equal(result.status, 'READY');
  assert.equal(result.route?.toolId, 'openrouter');
  assert.equal(result.route?.pricingStatus, 'VERIFIED_FREE');
});

test('falls back to Gemini when OpenRouter is not configured', () => {
  const result = resolveLiveFreeRoute({ GEMINI_API_KEY: 'gemini-key' });

  assert.equal(result.status, 'READY');
  assert.equal(result.route?.toolId, 'gemini-api');
});

test('blocks rather than fabricating success when no verified free route is configured', () => {
  const result = resolveLiveFreeRoute({});

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.route, undefined);
  assert.match(result.reason, /No configured verified free AI route/i);
});
