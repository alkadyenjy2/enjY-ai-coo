import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';

const repoRoot = new URL('..', import.meta.url).pathname;
const serverEntry = `${repoRoot}/dist/server.cjs`;
const config = {
  supabaseUrl: String(process.env.JARVIS_E2E_SUPABASE_URL || '').trim(),
  publishableKey: String(process.env.JARVIS_E2E_SUPABASE_PUBLISHABLE_KEY || '').trim(),
  email: String(process.env.JARVIS_E2E_TEST_EMAIL || '').trim(),
  password: String(process.env.JARVIS_E2E_TEST_PASSWORD || ''),
  organizationId: String(process.env.JARVIS_E2E_ORG_ID || '').trim(),
  geminiKey: String(process.env.JARVIS_E2E_GEMINI_API_KEY || '').trim(),
};

for (const [name, value] of Object.entries(config)) {
  if (!value) throw new Error(`Missing required JARVIS E2E environment variable for ${name}.`);
}

const port = 4300 + Math.floor(Math.random() * 200);
const baseUrl = `http://127.0.0.1:${port}`;

function runBuild() {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

async function waitForHealth(child) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return await response.json();
    } catch {
      // Server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error('JARVIS server did not become healthy within 15 seconds.');
}

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function signIn() {
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });
  const body = await response.json();
  assert.equal(response.ok, true, `Supabase sign-in failed: ${JSON.stringify(body)}`);
  assert.ok(body.access_token, 'Supabase sign-in should return an access token.');
  return body.access_token;
}

async function run() {
  console.log('\n[JARVIS E2E] 1/5 Build');
  runBuild();

  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      REQUIRE_LIVE_DEPENDENCIES: 'false',
      SUPABASE_URL: config.supabaseUrl,
      SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
      SUPABASE_ANON_KEY: '',
      GEMINI_API_KEY: config.geminiKey,
      TEMPORAL_ADDRESS: '',
      METRICS_TOKEN: '',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  try {
    console.log('[JARVIS E2E] 2/5 Health');
    const health = await waitForHealth(child);
    assert.equal(health.status, 'ok');
    console.log(`  ✓ server healthy (${health.version})`);

    console.log('[JARVIS E2E] 3/5 Authenticate');
    const accessToken = await signIn();
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: authHeaders(accessToken),
    });
    const me = await meResponse.json();
    assert.equal(meResponse.status, 200, `Auth context failed: ${JSON.stringify(me)}`);
    assert.ok(
      me.organizations?.some((org) => org.id === config.organizationId),
      'Configured organization must belong to the authenticated user.'
    );
    console.log('  ✓ authenticated + organization authorized');

    console.log('[JARVIS E2E] 4/5 Execute');
    const prompt = 'اقرأ عدد الـleads من Supabase';
    const commandResponse = await fetch(`${baseUrl}/api/agent/command?organization_id=${encodeURIComponent(config.organizationId)}`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({
        prompt,
        userProfile: {
          communicationPreference: 'concise',
          technicalLevel: 'advanced',
          autonomyLevel: 'full_autonomy',
          decisionStyle: 'execute_first',
        },
        activeProject: {
          name: 'AI CORE COO / JARVIS',
          objective: 'Prove the operational command loop end-to-end.',
          projectRules: ['Do not mutate production Make scenarios.'],
        },
        memoryContext: [],
        model: 'gemini-3.6-flash',
      }),
    });
    const command = await commandResponse.json();
    assert.equal(commandResponse.status, 200, `JARVIS command failed: ${JSON.stringify(command)}`);
    assert.equal(command.executionRecord?.intent, 'DATABASE');
    assert.equal(command.executionRecord?.verificationStatus, 'VERIFIED');
    assert.ok(Array.isArray(command.actionsTaken));
    console.log(`  ✓ intent=${command.executionRecord.intent}`);
    console.log(`  ✓ verification=${command.executionRecord.verificationStatus}`);
    console.log(`  ✓ tools=${command.executionRecord.selectedTools.join(', ')}`);

    console.log('[JARVIS E2E] 5/5 Verify persistence');
    const historyResponse = await fetch(
      `${baseUrl}/api/agent/history?limit=5&organization_id=${encodeURIComponent(config.organizationId)}`,
      { headers: authHeaders(accessToken) }
    );
    const history = await historyResponse.json();
    assert.equal(historyResponse.status, 200, `History read failed: ${JSON.stringify(history)}`);
    assert.ok(history.records?.some((record) => record.id === command.executionRecord.id));
    console.log(`  ✓ execution ${command.executionRecord.id} is present in operational history`);
    console.log('\nJARVIS_E2E=PROVEN');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

run().catch((error) => {
  console.error(`\nJARVIS_E2E=FAILED\n${error.stack || error.message}`);
  process.exitCode = 1;
});
