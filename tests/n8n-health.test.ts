import assert from 'node:assert/strict';
import { test } from 'node:test';
import { probeN8nHealth } from '../src/adapters/n8n-health.ts';

test('n8n is unconfigured unless both its base URL and API key exist', async () => {
  let calls = 0;
  const result = await probeN8nHealth({ N8N_URL: 'https://zeoutsourse.app.n8n.cloud' }, async () => {
    calls += 1;
    return new Response('{}', { status: 200 });
  });
  assert.equal(result.status, 'UNCONFIGURED');
  assert.equal(result.actualCall, false);
  assert.equal(calls, 0);
});

test('n8n reports REAL_LIVE only after an authenticated successful API response', async () => {
  let seenUrl = '';
  let seenKey = '';
  const result = await probeN8nHealth({
    N8N_URL: 'https://zeoutsourse.app.n8n.cloud/',
    N8N_API_KEY: 'test-only-key',
  }, async (input, init) => {
    seenUrl = String(input);
    seenKey = new Headers(init?.headers).get('X-N8N-API-KEY') || '';
    return new Response('{"data":[]}', { status: 200 });
  });
  assert.equal(result.status, 'REAL_LIVE');
  assert.equal(result.actualCall, true);
  assert.equal(seenUrl, 'https://zeoutsourse.app.n8n.cloud/api/v1/workflows?limit=1');
  assert.equal(seenKey, 'test-only-key');
});

test('n8n returns unhealthy when the authenticated API rejects the key', async () => {
  const result = await probeN8nHealth({
    N8N_URL: 'https://zeoutsourse.app.n8n.cloud',
    N8N_API_KEY: 'bad-test-key',
  }, async () => new Response('{"message":"unauthorized"}', { status: 401 }));
  assert.equal(result.status, 'UNHEALTHY_HTTP_401');
  assert.equal(result.actualCall, true);
  assert.doesNotMatch(JSON.stringify(result), /bad-test-key/);
});

test('n8n refuses non-HTTPS endpoints before sending credentials', async () => {
  let calls = 0;
  const result = await probeN8nHealth({ N8N_URL: 'http://n8n.example.com', N8N_API_KEY: 'test-only-key' }, async () => {
    calls += 1;
    return new Response('{}', { status: 200 });
  });
  assert.equal(result.status, 'UNCONFIGURED');
  assert.equal(result.actualCall, false);
  assert.equal(calls, 0);
});
