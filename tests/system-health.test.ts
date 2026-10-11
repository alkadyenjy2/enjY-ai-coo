import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemHealthProbe, isSystemHealthCommand, shouldUseDeterministicSystemHealth } from '../src/core/system-health';

test('reports Supabase configuration without claiming a live read before probing', () => {
  const result = buildSystemHealthProbe({
    supabaseUrl: 'https://example.supabase.co',
    supabaseApiKey: 'secret',
    openaiConfigured: true,
    geminiConfigured: false,
    metaConfigured: false,
  });

  assert.equal(result.status, 'CONFIGURED');
  assert.equal(result.connector, 'supabase');
  assert.equal(result.providerFallback, 'openai_configured');
  assert.match(result.evidence, /has not been verified yet/);
});

test('reports an unconfigured connector without claiming live verification', () => {
  const result = buildSystemHealthProbe({
    supabaseUrl: '',
    supabaseApiKey: '',
    openaiConfigured: true,
    geminiConfigured: false,
    metaConfigured: false,
  });

  assert.equal(result.status, 'UNCONFIGURED');
  assert.equal(result.providerFallback, 'openai_configured');
});

test('recognizes the explicit SYSTEM_HEALTH command', () => {
  assert.equal(isSystemHealthCommand('SYSTEM_HEALTH'), true);
  assert.equal(isSystemHealthCommand('system health'), true);
  assert.equal(isSystemHealthCommand('system status'), false);
});

test('routes SYSTEM_HEALTH through the deterministic read-only path even when a model key is configured', () => {
  assert.equal(shouldUseDeterministicSystemHealth('SYSTEM_HEALTH'), true);
  assert.equal(shouldUseDeterministicSystemHealth('GENERAL'), false);
});
