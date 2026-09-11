import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryMemoryGateway } from '../src/memory/memory-gateway.ts';

function gateway() {
  return new InMemoryMemoryGateway();
}

test('memory gateway writes and reads a tenant-scoped memory', async () => {
  const memory = gateway();
  const receipt = await memory.write({
    tenantId: 'tenant-a',
    agentId: 'ai-core',
    memoryType: 'decision',
    content: 'Use MemPalace as the cognitive memory substrate.',
    source: 'ai-core-audit',
    sourceRef: 'poc-01',
    tags: ['memory', 'mempalace'],
  });

  assert.equal(receipt.status, 'STORED');
  const record = await memory.read(receipt.memoryId, 'tenant-a');
  assert.ok(record);
  assert.equal(record?.content, 'Use MemPalace as the cognitive memory substrate.');
  assert.equal(record?.provenanceId, receipt.provenanceId);
});

test('memory recall is tenant isolated', async () => {
  const memory = gateway();
  await memory.write({
    tenantId: 'tenant-a',
    agentId: 'ai-core',
    memoryType: 'decision',
    content: 'Tenant A approved the memory gateway contract.',
    source: 'test',
  });
  await memory.write({
    tenantId: 'tenant-b',
    agentId: 'ai-core',
    memoryType: 'decision',
    content: 'Tenant B approved the memory gateway contract.',
    source: 'test',
  });

  const results = await memory.recall({
    tenantId: 'tenant-a',
    query: 'memory gateway contract',
  });

  assert.equal(results.length, 1);
  assert.match(results[0].content, /Tenant A/);
});

test('forget removes a memory from active recall and read', async () => {
  const memory = gateway();
  const receipt = await memory.write({
    tenantId: 'tenant-a',
    agentId: 'ai-core',
    memoryType: 'preference',
    content: 'Prefer local-first memory.',
    source: 'test',
  });

  const forgotten = await memory.forget({
    memoryId: receipt.memoryId,
    tenantId: 'tenant-a',
    reason: 'user requested removal',
    requestedBy: 'user',
  });

  assert.equal(forgotten.status, 'FORGOTTEN');
  assert.equal(await memory.read(receipt.memoryId, 'tenant-a'), null);
  assert.deepEqual(await memory.recall({ tenantId: 'tenant-a', query: 'local-first memory' }), []);
});

test('provenance stays attached to a memory', async () => {
  const memory = gateway();
  const receipt = await memory.write({
    tenantId: 'tenant-a',
    agentId: 'ai-core',
    memoryType: 'decision',
    content: 'Supabase remains the operational audit store.',
    source: 'architecture-audit',
    sourceRef: 'poc-01',
  });

  const provenance = await memory.provenance(receipt.memoryId, 'tenant-a');
  assert.ok(provenance);
  assert.equal(provenance?.source, 'architecture-audit');
  assert.equal(provenance?.sourceRef, 'poc-01');
  assert.equal(provenance?.tenantId, 'tenant-a');
});

test('cross-tenant reads and provenance are denied', async () => {
  const memory = gateway();
  const receipt = await memory.write({
    tenantId: 'tenant-a',
    agentId: 'ai-core',
    memoryType: 'decision',
    content: 'Private tenant memory.',
    source: 'test',
  });

  assert.equal(await memory.read(receipt.memoryId, 'tenant-b'), null);
  assert.equal(await memory.provenance(receipt.memoryId, 'tenant-b'), null);
});
