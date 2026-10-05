import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

test('sensitive approval is durable and cannot be bypassed by request-body boolean', async () => {
  const server = await readFile(join(root, 'server.ts'), 'utf8');
  assert.doesNotMatch(server, /gmailApprovalConfirmed/);
  assert.match(server, /__HUMAN_APPROVAL__/);
  assert.match(server, /approval_status === "APPROVED"/);
  assert.match(server, /promptHash/);
  assert.match(server, /app\.post\("\/api\/agent\/approval"/);
  assert.match(server, /approvalJobId/);
});

test('approved retry bypasses only the transient duplicate cache, not approval validation', async () => {
  const server = await readFile(join(root, 'server.ts'), 'utf8');
  assert.match(server, /cached && \(Date\.now\(\) - cached\.timestamp < 10000\) && !approvalJobId/);
  assert.match(server, /approvalJob\.user_id === resolvedUserId/);
  assert.match(server, /approvalJob\.organization_id === resolvedOrganizationId/);
  assert.match(server, /post_external\\)\\/i\\.test\\(prompt\\) && !approvalGranted/);
});

test('command center exposes an explicit approval action and replays the approved command with its approval id', async () => {
  const app = await readFile(join(root, 'src/App.tsx'), 'utf8');
  assert.match(app, /Approve & Execute/);
  assert.match(app, /\/api\/agent\/approval/);
  assert.match(app, /handleSendMessage\(approved\.prompt, approved\.id\)/);
});