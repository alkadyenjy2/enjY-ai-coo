import test from 'node:test';
import assert from 'node:assert/strict';
import { isLiveModelRouteConfigured, resolveLiveModelRoute } from '../src/ai-gateway/live-model-route';

test('does not treat an OpenAI key as an active route when paid models are disabled', () => {
  assert.equal(isLiveModelRouteConfigured({ OPENAI_API_KEY: 'configured' }), false);
});

test('uses a configured verified free-first provider route', () => {
  const env = { OPENROUTER_API_KEY: 'configured' };
  assert.equal(isLiveModelRouteConfigured(env), true);
  assert.equal(resolveLiveModelRoute(env)?.providerId, 'openrouter');
});

test('uses Gemini when OpenRouter is absent and Gemini is configured', () => {
  const env = { GEMINI_API_KEY: 'configured' };
  assert.equal(isLiveModelRouteConfigured(env), true);
  assert.equal(resolveLiveModelRoute(env)?.providerId, 'gemini-api');
});

test('allows the default OpenAI route only when paid execution is explicitly enabled', () => {
  assert.equal(isLiveModelRouteConfigured({ OPENAI_API_KEY: 'configured', JARVIS_ALLOW_PAID_MODEL: 'true' }), true);
  assert.equal(isLiveModelRouteConfigured({ GEMINI_API_KEY: 'configured', JARVIS_ALLOW_PAID_MODEL: 'true' }), false);
});

test('does not treat blank credentials as configured', () => {
  assert.equal(isLiveModelRouteConfigured({ OPENROUTER_API_KEY: '  ', GEMINI_API_KEY: '' }), false);
});
