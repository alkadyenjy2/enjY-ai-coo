import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const workflowPath = fileURLToPath(new URL('../.github/workflows/ci.yml', import.meta.url));
const workflow = await readFile(workflowPath, 'utf8');

test('live auth E2E cannot run as a partial pass without cross-tenant fixture', () => {
  const authGate = workflow.match(/if \\[\\[ ([^\\n]+) \\]\\]; then\\n\\s+npm run test:auth-e2e/);
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
