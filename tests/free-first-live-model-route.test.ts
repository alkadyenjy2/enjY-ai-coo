import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLiveModelRoute } from '../src/ai-gateway/live-model-route';

test('fails closed when no supported live provider credential is configured', () => {
  assert.equal(resolveLiveModelRoute({}), null);
});

test('selects the highest-ranked configured supported free-first provider', () => {
  const route = resolveLiveModelRoute({
    OPENROUTER_API_KEY: 'test-openrouter-key',
    GEMINI_API_KEY: 'test-gemini-key',
  });

  assert.deepEqual(route, {
    providerId: 'openrouter',
    model: 'openrouter/free',
    apiKey: 'test-openrouter-key',
    baseUrl: 'https://openrouter.ai/api/v1',
  });
});

test('uses the existing Gemini adapter when it is the only supported provider configured', () => {
  assert.deepEqual(resolveLiveModelRoute({
    GEMINI_API_KEY: 'test-gemini-key',
  }), {
    providerId: 'gemini-api',
    model: 'gemini-3.6-flash',
    apiKey: 'test-gemini-key',
    baseUrl: null,
  });
});

test('keeps metered Groq disabled unless its explicit billing gate is enabled', () => {
  assert.equal(resolveLiveModelRoute({ GROQ_API_KEY: 'test-groq-key' }), null);
});

test('selects Groq Responses API only when the explicit billing gate is enabled', () => {
  assert.deepEqual(resolveLiveModelRoute({
    GROQ_API_KEY: 'test-groq-key',
    JARVIS_ALLOW_GROQ_BILLABLE: 'true',
  }), {
    providerId: 'groq',
    model: 'openai/gpt-oss-120b',
    apiKey: 'test-groq-key',
    baseUrl: 'https://api.groq.com/openai/v1',
  });
});

test('trims credentials and refuses blank configured values', () => {
  assert.equal(resolveLiveModelRoute({
    OPENROUTER_API_KEY: '   ',
    GEMINI_API_KEY: '\t',
  }), null);
});
