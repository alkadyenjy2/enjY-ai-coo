import test from 'node:test';
import assert from 'node:assert/strict';
import { runPersistenceContext } from '../src/adapters/request-context';
import { persistOperationalRecord } from '../src/adapters/persistence';

const record = {
  id: 'exec-idempotency-test-1',
  timestamp: '2026-10-25T00:00:00.000Z',
  command: 'idempotency regression',
  project: 'JARVIS',
  intent: 'test_execution',
  tool: 'none',
  selectedTools: [],
  actionsExecuted: [],
  results: { safe: true },
  state_history: ['RECEIVED', 'VERIFIED'],
  evidence: 'synthetic test only',
  verificationStatus: 'VERIFIED' as const,
  final_state_reason: 'test',
  errors: [],
  approvalStatus: 'AUTO_APPROVED' as const,
};

test('retries of the same execution return the same durable audit row', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const rows = new Map<string, { id: string; organization_id: string; type: string; idempotency_key: string }>();
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, init });
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      const key = String(body.idempotency_key);
      assert.match(url, /on_conflict=idempotency_key/);
      assert.match(String((init.headers as Record<string, string>).Prefer), /resolution=ignore-duplicates/);
      if (rows.has(key)) return new Response('[]', { status: 201 });
      const row = { id: 'audit-canonical-1', organization_id: body.organization_id, type: body.type, idempotency_key: key };
      rows.set(key, row);
      return new Response(JSON.stringify([row]), { status: 201 });
    }
    const query = new URL(url).searchParams;
    const key = (query.get('idempotency_key') || '').replace(/^eq\./, '');
    const row = rows.get(key);
    return new Response(JSON.stringify(row ? [{ id: row.id }] : []), { status: 200 });
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
    assert.equal(first.recordId, 'audit-canonical-1');
    assert.equal(retry.recordId, 'audit-canonical-1');
    assert.equal(rows.size, 1, 'a retry must not create a second durable row');
    assert.equal(requests.length, 3, 'first insert, duplicate insert attempt, and canonical readback');
    const body = JSON.parse(String(requests[0].init?.body));
    assert.equal(body.idempotency_key, '11111111-1111-1111-1111-111111111111:ai_core_execution:exec-idempotency-test-1');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
