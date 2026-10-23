import test from 'node:test';
import assert from 'node:assert/strict';
import { runPersistenceContext } from '../src/adapters/request-context';
import { persistOperationalRecord } from '../src/adapters/persistence';

const record = {
  id: 'retry-idempotency-exec-1',
  timestamp: '2026-10-23T00:00:00.000Z',
  command: 'Retry a safe operational record',
  project: 'AI CORE COO',
  intent: 'idempotency_retry_test',
  tool: 'none',
  selectedTools: [],
  actionsExecuted: [],
  results: {},
  state_history: ['RECEIVED', 'VERIFIED'],
  evidence: 'synthetic retry test',
  verificationStatus: 'VERIFIED' as const,
  final_state_reason: 'synthetic test only',
  errors: [],
  approvalStatus: 'AUTO_APPROVED' as const,
};

test('operational audit retry uses a stable idempotency key and conflict-safe insert', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const persisted = new Map<string, { id: string; body: Record<string, unknown> }>();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, init });
    if ((init?.method || 'GET') === 'GET') {
      return new Response(JSON.stringify([...persisted.values()].map(row => ({ id: row.id }))), { status: 200 });
    }
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const key = `${body.organization_id}:${body.idempotency_key}`;
    if (persisted.has(key)) return new Response('[]', { status: 201 });
    const row = { id: 'audit-stable-1', body };
    persisted.set(key, row);
    return new Response(JSON.stringify([{ id: row.id }]), { status: 201 });
  }) as typeof fetch;

  try {
    const context = {
      organizationId: '11111111-1111-1111-1111-111111111111',
      userId: '22222222-2222-2222-2222-222222222222',
      accessToken: 'user-access-token',
    };
    const first = await runPersistenceContext(context, () => persistOperationalRecord(record));
    const retry = await runPersistenceContext(context, () => persistOperationalRecord(record));

    assert.equal(first.persisted, true);
    assert.equal(retry.persisted, true);
    assert.equal(persisted.size, 1, 'same organization/execution retry must not create a second row');
    assert.equal(requests.length, 3, 'two inserts plus one readback after the duplicate retry');
    const postRequests = requests.filter(request => (request.init?.method || 'GET') === 'POST');
    assert.equal(postRequests.length, 2);
    assert.equal(retry.recordId, 'audit-stable-1');
    for (const request of postRequests) {
      const url = new URL(request.url);
      assert.equal(url.searchParams.get('on_conflict'), 'organization_id,idempotency_key');
      const headers = request.init?.headers as Record<string, string>;
      assert.match(headers.Prefer, /resolution=ignore-duplicates/);
      const body = JSON.parse(String(request.init?.body));
      assert.equal(body.idempotency_key, record.id);
      assert.equal(body.execution_id, record.id);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

test('duplicate audit retry returns the canonical persisted record ID after readback', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  let insertCount = 0;
  let lookupCount = 0;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    if ((init?.method || 'GET') === 'POST') {
      insertCount += 1;
      if (insertCount === 1) return new Response(JSON.stringify([{ id: 'audit-canonical-1' }]), { status: 201 });
      return new Response('[]', { status: 201 });
    }
    lookupCount += 1;
    return new Response(JSON.stringify([{ id: 'audit-canonical-1' }]), { status: 200 });
  }) as typeof fetch;
  try {
    const context = {
      organizationId: '11111111-1111-1111-1111-111111111111',
      userId: '22222222-2222-2222-2222-222222222222',
      accessToken: 'user-access-token',
    };
    const first = await runPersistenceContext(context, () => persistOperationalRecord(record));
    const retry = await runPersistenceContext(context, () => persistOperationalRecord(record));
    assert.equal(first.recordId, 'audit-canonical-1');
    assert.equal(retry.persisted, true);
    assert.equal(retry.recordId, 'audit-canonical-1');
    assert.equal(insertCount, 2);
    assert.equal(lookupCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
