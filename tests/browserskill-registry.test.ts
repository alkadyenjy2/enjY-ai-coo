import test from 'node:test';
import assert from 'node:assert/strict';
import { FREE_AI_REGISTRY } from '../src/data/free-ai-registry';
import { selectRoutes } from '../src/ai-gateway/free-first-router';

test('BrowserSkill is registered as a verified local OSS browser capability', () => {
  const entry = FREE_AI_REGISTRY.find((item) => item.toolId === 'browserskill');

  assert.ok(entry);
  assert.equal(entry.pricingStatus, 'OSS_FREE');
  assert.equal(entry.verificationStatus, 'VERIFIED');
  assert.equal(entry.automationLevel, 'FULL_API');
  assert.ok(entry.capabilities.includes('browser_automation'));
});

test('free-first routing can select BrowserSkill for browser automation', () => {
  const routes = selectRoutes(FREE_AI_REGISTRY, {
    capabilities: ['browser_automation'],
    allowPaid: false,
    requireApi: false,
  });

  assert.equal(routes[0]?.toolId, 'browserskill');
});
