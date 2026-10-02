import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveJarvisModel, selectRoutes } from '../src/ai-gateway/free-first-router';
import { FREE_AI_REGISTRY } from '../src/data/free-ai-registry';

test('selects verified free providers before free-tier providers', () => {
  const routes = selectRoutes(FREE_AI_REGISTRY, {
    capabilities: ['chat'],
    allowPaid: false,
  });

  assert.equal(routes[0]?.toolId, 'openrouter');
  assert.ok(routes.every((route) => route.pricingStatus !== 'PAID_ONLY'));
});

test('excludes unverified tools from production routing', () => {
  const routes = selectRoutes(FREE_AI_REGISTRY, {
    capabilities: ['video_generation'],
    allowPaid: false,
  });

  assert.ok(routes.every((route) => route.verificationStatus === 'VERIFIED'));
});

test('returns fallback candidates in deterministic priority order', () => {
  const routes = selectRoutes(FREE_AI_REGISTRY, {
    capabilities: ['chat'],
    allowPaid: false,
  });

  assert.deepEqual(
    routes.slice(0, 4).map((route) => route.toolId),
    ['openrouter', 'gemini-api', 'groq', 'mistral'],
  );
});

test('does not select paid-only routes unless explicitly allowed', () => {
  const routes = selectRoutes([
    {
      toolId: 'paid-test',
      name: 'Paid Test',
      category: 'ai',
      accessType: 'API',
      capabilities: ['chat'],
      pricingStatus: 'PAID_ONLY',
      requiresAccount: true,
      requiresCard: true,
      automationLevel: 'FULL_API',
      priority: 1,
      enabled: true,
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: '2026-09-16',
      verificationSource: 'test',
      fallbackToolIds: [],
    },
  ], {
    capabilities: ['chat'],
    allowPaid: false,
  });

  assert.equal(routes.length, 0);
});


test('defaults to the free Gemini model when no model is requested', () => {
  assert.equal(resolveJarvisModel(undefined, false), 'gemini-3.6-flash');
});

test('reroutes paid models to Gemini unless paid execution is explicitly enabled', () => {
  assert.equal(resolveJarvisModel('gpt-6-astra', false), 'gemini-3.6-flash');
  assert.equal(resolveJarvisModel('muse-spark-1.3', false), 'gemini-3.6-flash');
  assert.equal(resolveJarvisModel('gpt-6-astra', true), 'gpt-6-astra');
});
