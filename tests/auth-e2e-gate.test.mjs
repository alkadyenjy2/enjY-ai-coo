import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const workflowPath = fileURLToPath(new URL('../.github/workflows/ci.yml', import.meta.url));
const workflow = await readFile(workflowPath, 'utf8');
const authE2EPath = fileURLToPath(new URL('./auth.e2e.test.mjs', import.meta.url));
const authE2E = await readFile(authE2EPath, 'utf8');

test('live auth E2E cannot run as a partial pass without cross-tenant fixture', () => {
  const authGate = workflow.match(/if \[\[ ([^\r\n]+) \]\]; then\r?\n\s+npm run test:auth-e2e/);
  assert.ok(authGate, 'CI must have an explicit gate for the live auth E2E command');
  for (const secret of [
    'AUTH_E2E_SUPABASE_URL',
    'AUTH_E2E_SUPABASE_PUBLISHABLE_KEY',
    'AUTH_E2E_TEST_EMAIL',
    'AUTH_E2E_TEST_PASSWORD',
    'AUTH_E2E_MEMBER_ORG_ID',
    'AUTH_E2E_NON_MEMBER_ORG_ID',
  ]) {
    assert.ok(authGate[1].includes('$' + secret), 'CI gate must require ' + secret);
  }
  assert.match(workflow, /cross-tenant denial remain unverified/);
});

test('live auth E2E requires durable Supabase history instead of process memory', () => {
  assert.match(
    authE2E,
    /assert\.equal\(history\.source,\s*['"]supabase['"]/,
    'live auth E2E must fail unless history is read from durable Supabase storage'
  );
});
