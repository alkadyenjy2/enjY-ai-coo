import test from 'node:test';
import assert from 'node:assert/strict';
import { runPersistenceContext } from '../src/adapters/request-context';
import { persistOperationalRecord } from '../src/adapters/persistence';

const record = {
  id: 'exec-idempotency-retry-1', timestamp: '2026-10-23T00:00:00.000Z', command: 'test retry', project: 'JARVIS',
  intent: 'test_execution', tool: 'none', selectedTools: [], actionsExecuted: [], results: {}, state_history: [],
  evidence: 'synthetic test', verificationStatus: 'VERIFIED' as const, final_state_reason: 'test', errors: [], approvalStatus: 'AUTO_APPROVED' as const,
};

test('operational audit insert uses a database-enforced idempotency conflict target', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify([{ id: 'audit-once' }]), { status: 201 });
  }) as typeof fetch;
  try {
    const result = await runPersistenceContext({ organizationId: '11111111-1111-1111-1111-111111111111', userId: '22222222-2222-2222-2222-222222222222', accessToken: 'user-token' }, () => persistOperationalRecord(record));
    assert.equal(result.persisted, true);
    assert.equal(requests.length, 1);
    const url = new URL(requests[0].url);
    assert.equal(url.searchParams.get('on_conflict'), 'organization_id,execution_id,type');
    assert.equal((requests[0].init?.headers as Record<string, string>).Prefer, 'resolution=ignore-duplicates,return=representation');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

test('retries with the same execution ID create one durable audit row', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const rows = new Map<string, { id: string; body: Record<string, unknown> }>();
  let nextId = 1;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('on_conflict'), 'organization_id,execution_id,type');
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const key = `${body.organization_id}:${body.execution_id}:${body.type}`;
    if (rows.has(key)) return new Response('[]', { status: 201, headers: { 'Content-Type': 'application/json' } });
    const row = { id: `audit-${nextId++}`, body };
    rows.set(key, row);
    return new Response(JSON.stringify([row]), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  try {
    const context = { organizationId: '11111111-1111-1111-1111-111111111111', userId: '22222222-2222-2222-2222-222222222222', accessToken: 'user-token' };
    const first = await runPersistenceContext(context, () => persistOperationalRecord(record));
    const retry = await runPersistenceContext(context, () => persistOperationalRecord(record));
    assert.equal(first.persisted, true);
    assert.equal(first.recordId, 'audit-1');
    assert.equal(retry.persisted, true);
    assert.equal(retry.recordId, undefined, 'duplicate-ignore response has no newly inserted row');
    assert.equal(rows.size, 1, 'database unique constraint keeps only one durable audit row');
    assert.equal(nextId, 2, 'retry does not allocate a second row');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
