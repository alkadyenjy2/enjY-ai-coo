import test from 'node:test';
import assert from 'node:assert/strict';
import { runPersistenceContext } from '../src/adapters/request-context';
import { persistOperationalRecord } from '../src/adapters/persistence';

const record = {
  id: 'exec-context-1',
  timestamp: '2026-09-10T00:00:00.000Z',
  command: 'Run tenant operation',
  project: 'AI CORE COO',
  intent: 'test_execution',
  tool: 'none',
  selectedTools: [],
  results: {},
  state_history: [],
  evidence: 'test',
  verificationStatus: 'VERIFIED' as const,
  final_state_reason: 'test',
  errors: [],
  approvalStatus: 'AUTO_APPROVED' as const,
};

test('persists operational records with authenticated tenant context', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify([{ id: 'audit-1' }]), { status: 201 });
  }) as typeof fetch;

  try {
    const result = await runPersistenceContext(
      {
        organizationId: '11111111-1111-1111-1111-111111111111',
        userId: '22222222-2222-2222-2222-222222222222',
        accessToken: 'user-access-token',
      },
      () => persistOperationalRecord(record),
    );

    assert.equal(result.persisted, true);
    assert.equal(requests.length, 1);
    const body = JSON.parse(String(requests[0].init?.body));
    assert.equal(body.organization_id, '11111111-1111-1111-1111-111111111111');
    assert.equal(body.user_id, '22222222-2222-2222-2222-222222222222');
    assert.equal((requests[0].init?.headers as Record<string, string>).Authorization, 'Bearer user-access-token');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

test('refuses durable persistence without an authenticated tenant context', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  let called = false;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  globalThis.fetch = (async () => {
    called = true;
    return new Response('[]', { status: 201 });
  }) as typeof fetch;

  try {
    const result = await persistOperationalRecord(record);
    assert.equal(result.persisted, false);
    assert.equal(result.source, 'memory');
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
