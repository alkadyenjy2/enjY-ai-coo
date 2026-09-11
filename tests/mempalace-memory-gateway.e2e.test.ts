import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import test from 'node:test';
import { MemPalaceMemoryGateway, MemPalaceMcpHttpTransport } from '../src/memory/mempalace-mcp.js';

const endpoint = 'http://127.0.0.1:8765/mcp';

async function waitForHealth(timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:8765/healthz');
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await sleep(500);
  }
  throw new Error('MEMPALACE_SERVER_START_TIMEOUT');
}

function startServer(palacePath: string): ChildProcess {
  const child = spawn('mempalace-mcp', [
    '--transport', 'http',
    '--host', '127.0.0.1',
    '--port', '8765',
    '--palace', palacePath,
  ], {
    env: {
      ...process.env,
      MEMPALACE_MCP_IDLE_HOURS: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr?.on('data', (chunk) => { stderr += String(chunk); });
  child.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      process.stderr.write(`MemPalace exited unexpectedly: code=${code} signal=${signal}\\n${stderr}`);
    }
  });
  return child;
}

test('MemPalace adapter real MCP smoke test', { timeout: 120_000 }, async (t) => {
  const palacePath = await mkdtemp(join(tmpdir(), 'enjY-mempalace-'));
  const server = startServer(palacePath);
  t.after(async () => {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise<void>((resolve) => server.once('exit', () => resolve())),
      sleep(5_000).then(() => undefined),
    ]);
    await rm(palacePath, { recursive: true, force: true });
  });

  await waitForHealth();

  const gateway = new MemPalaceMemoryGateway(new MemPalaceMcpHttpTransport(endpoint));
  const tenantA = 'e2e-tenant-a';
  const tenantB = 'e2e-tenant-b';
  const marker = `enjY-real-mempalace-${Date.now()}`;

  const receipt = await gateway.write({
    tenantId: tenantA,
    agentId: 'e2e-agent',
    memoryType: 'decision',
    content: `Durable memory smoke marker: ${marker}`,
    source: 'ci-real-mcp-smoke',
  });

  assert.equal(receipt.status, 'STORED');
  assert.ok(receipt.memoryId);

  const ownRead = await gateway.read(receipt.memoryId, tenantA);
  assert.ok(ownRead);
  assert.match(ownRead.content, new RegExp(marker));
  assert.equal(ownRead.tenantId, tenantA);

  const crossTenantRead = await gateway.read(receipt.memoryId, tenantB);
  assert.equal(crossTenantRead, null);

  const recall = await gateway.recall({ tenantId: tenantA, query: marker, limit: 5 });
  assert.ok(recall.some((item) => item.memoryId === receipt.memoryId && item.content.includes(marker)));

  const crossTenantRecall = await gateway.recall({ tenantId: tenantB, query: marker, limit: 5 });
  assert.equal(crossTenantRecall.length, 0);

  const provenance = await gateway.provenance(receipt.memoryId, tenantA);
  assert.ok(provenance);
  assert.equal(provenance.memoryId, receipt.memoryId);
  assert.equal(provenance.tenantId, tenantA);

  const forget = await gateway.forget({
    memoryId: receipt.memoryId,
    tenantId: tenantA,
    reason: 'real MCP smoke cleanup',
    requestedBy: 'ci',
  });
  assert.equal(forget.status, 'FORGOTTEN');
  assert.equal(await gateway.read(receipt.memoryId, tenantA), null);
});
