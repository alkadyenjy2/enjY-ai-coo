import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('..', import.meta.url).pathname;
const serverEntry = `${repoRoot}/dist/server.cjs`;

async function waitForHealth(baseUrl, child) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error('Production server did not become healthy within 7.5 seconds');
}

async function withServer(callback) {
  const port = 3900 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      GEMINI_API_KEY: '',
      SUPABASE_URL: '',
      SUPABASE_PUBLISHABLE_KEY: '',
      SUPABASE_ANON_KEY: '',
      TEMPORAL_ADDRESS: '',
      METRICS_TOKEN: '',
    },
    stdio: 'ignore',
  });

  try {
    await waitForHealth(baseUrl, child);
    return await callback(baseUrl);
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

test('public health stays available while operational routes require authentication', async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);

    for (const path of ['/api/auth/me', '/api/connectors/status', '/api/env-status', '/api/agent/history?limit=1&organization_id=00000000-0000-0000-0000-000000000000']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, `${path} should reject unauthenticated requests`);
    }

    const command = await fetch(`${baseUrl}/api/agent/command`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'status' }),
    });
    assert.equal(command.status, 401);
  });
});
