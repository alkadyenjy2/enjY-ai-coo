import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const repoRoot = new URL('..', import.meta.url).pathname;
const serverEntry = `${repoRoot}/dist/server.cjs`;
const e2eConfig = {
  supabaseUrl: String(process.env.AUTH_E2E_SUPABASE_URL || '').trim(),
  publishableKey: String(process.env.AUTH_E2E_SUPABASE_PUBLISHABLE_KEY || '').trim(),
  email: String(process.env.AUTH_E2E_TEST_EMAIL || '').trim(),
  password: String(process.env.AUTH_E2E_TEST_PASSWORD || ''),
  memberOrganizationId: String(process.env.AUTH_E2E_MEMBER_ORG_ID || '').trim(),
  nonMemberOrganizationId: String(process.env.AUTH_E2E_NON_MEMBER_ORG_ID || '').trim(),
};

const positiveConfigReady = Boolean(
  e2eConfig.supabaseUrl &&
  e2eConfig.publishableKey &&
  e2eConfig.email &&
  e2eConfig.password &&
  e2eConfig.memberOrganizationId
);
const crossTenantConfigReady = positiveConfigReady && Boolean(e2eConfig.nonMemberOrganizationId);

async function waitForHealth(baseUrl, child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error('Production server did not become healthy within 10 seconds');
}

async function withAuthenticatedServer(callback) {
  const port = 4200 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      REQUIRE_LIVE_DEPENDENCIES: 'false',
      SUPABASE_URL: e2eConfig.supabaseUrl,
      SUPABASE_PUBLISHABLE_KEY: e2eConfig.publishableKey,
      SUPABASE_ANON_KEY: '',
      GEMINI_API_KEY: '',
      TEMPORAL_ADDRESS: '',
      METRICS_TOKEN: '',
    },
    stdio: 'ignore',
  });

  try {
    await waitForHealth(baseUrl, child);
    const supabase = createClient(e2eConfig.supabaseUrl, e2eConfig.publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: e2eConfig.email,
      password: e2eConfig.password,
    });
    assert.ifError(error);
    assert.ok(data.session?.access_token, 'test account should return a Supabase access token');
    return await callback({ baseUrl, accessToken: data.session.access_token });
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

test(
  'positive auth resolves the user and permits an authorized organization history read',
  { skip: !positiveConfigReady ? 'Set AUTH_E2E_SUPABASE_URL, AUTH_E2E_SUPABASE_PUBLISHABLE_KEY, AUTH_E2E_TEST_EMAIL, AUTH_E2E_TEST_PASSWORD, and AUTH_E2E_MEMBER_ORG_ID to run the live positive test.' : false },
  async () => {
    await withAuthenticatedServer(async ({ baseUrl, accessToken }) => {
      const meResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders(accessToken) });
      assert.equal(meResponse.status, 200);
      const me = await meResponse.json();
      assert.equal(me.authenticated, true);
      assert.ok(me.user?.id, 'auth/me should return the authenticated user id');
      assert.ok(
        me.organizations?.some((organization) => organization.id === e2eConfig.memberOrganizationId),
        'auth/me should return the configured member organization'
      );

      const historyResponse = await fetch(
        `${baseUrl}/api/agent/history?limit=1&organization_id=${encodeURIComponent(e2eConfig.memberOrganizationId)}`,
        { headers: authHeaders(accessToken) }
      );
      assert.equal(historyResponse.status, 200);
      const history = await historyResponse.json();
      assert.equal(typeof history.total, 'number');
      assert.ok(['supabase', 'memory'].includes(history.source));
    });
  }
);

test(
  'positive auth rejects the same user when requesting a non-member organization',
  { skip: !crossTenantConfigReady ? 'Set AUTH_E2E_NON_MEMBER_ORG_ID in addition to the positive Auth variables to run the cross-tenant denial test.' : false },
  async () => {
    assert.notEqual(
      e2eConfig.memberOrganizationId,
      e2eConfig.nonMemberOrganizationId,
      'member and non-member organization IDs must be different'
    );

    await withAuthenticatedServer(async ({ baseUrl, accessToken }) => {
      const response = await fetch(
        `${baseUrl}/api/agent/history?limit=1&organization_id=${encodeURIComponent(e2eConfig.nonMemberOrganizationId)}`,
        { headers: authHeaders(accessToken) }
      );
      assert.equal(response.status, 403);
      const body = await response.json();
      assert.match(body.error, /not a member/i);
    });
  }
);
