import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemHealthProbe, isSystemHealthCommand } from '../src/core/system-health';

test('builds a real connector probe when Supabase is configured', () => {
  const result = buildSystemHealthProbe({
    supabaseUrl: 'https://example.supabase.co',
    supabaseApiKey: 'secret',
    openaiConfigured: true,
    geminiConfigured: false,
    metaConfigured: false,
  });

  assert.equal(result.status, 'REAL_LIVE');
  assert.equal(result.connector, 'supabase');
  assert.equal(result.providerFallback, 'openai_configured');
  assert.match(result.evidence, /REAL_LIVE/);
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
