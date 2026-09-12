import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { MemPalaceMemoryGateway, MemPalaceMcpTransport } from '../src/memory/mempalace-mcp.ts';

const tenantWing = 'ai-core:80a707af7dc77ee1228f9127';
const deterministicDrawerId = (wing: string, room: string, content: string) => {
  const key = [wing, room, content].map((part) => `${part.length}:${part}`).join('');
  return `drawer_${wing}_${room}_${createHash('sha256').update(key).digest('hex').slice(0, 24)}`;
};

class FakeTransport implements MemPalaceMcpTransport {
  calls: Array<{ method: string; params?: Record<string, unknown> }> = [];
  private drawer = {
    drawer_id: deterministicDrawerId(tenantWing, 'memory:decision', 'AI CORE memory'),
    content: 'AI CORE memory', wing: tenantWing, room: 'memory:decision',
    metadata: { added_by: 'agent-1', source_file: 'ai-core://memory/prov' },
  };

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    this.calls.push({ method, params });
    if (method !== 'tools/call') return { serverInfo: { name: 'mempalace' } } as T;
    const name = params.name;
    if (name === 'mempalace_add_drawer') return { content: [{ type: 'text', text: JSON.stringify({ success: true, drawer_id: this.drawer.drawer_id }) }] } as T;
    if (name === 'mempalace_search') return { content: [{ type: 'text', text: JSON.stringify({ results: [{ drawer_id: this.drawer.drawer_id, text: 'AI CORE memory', wing: tenantWing, room: 'memory:decision', source_file: 'ai-core://memory/prov', similarity: 0.91 }] }) }] } as T;
    if (name === 'mempalace_get_drawer') {
      const drawerId = (params.arguments as Record<string, unknown>).drawer_id;
      return { content: [{ type: 'text', text: JSON.stringify(drawerId === this.drawer.drawer_id ? this.drawer : {}) }] } as T;
    }
    if (name === 'mempalace_delete_drawer') return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] } as T;
    throw new Error(`unexpected tool ${String(name)}`);
  }
}

class FallbackWriteTransport extends FakeTransport {
  override async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (method === 'tools/call' && params.name === 'mempalace_add_drawer') {
      this.calls.push({ method, params });
      return { content: [{ type: 'text', text: 'Stored successfully.' }] } as T;
    }
    return super.call<T>(method, params);
  }
}

class SearchWithoutDrawerIdTransport extends FakeTransport {
  override async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (method === 'tools/call' && params.name === 'mempalace_search') {
      this.calls.push({ method, params });
      return { content: [{ type: 'text', text: JSON.stringify({ results: [{ text: 'AI CORE memory', wing: tenantWing, room: 'memory:decision', source_file: 'ai-core://memory/prov', similarity: 0.91 }] }) }] } as T;
    }
    return super.call<T>(method, params);
  }
}

test('writes into a tenant-scoped MemPalace wing', async () => {
  const transport = new FakeTransport();
  const gateway = new MemPalaceMemoryGateway(transport);
  const receipt = await gateway.write({ tenantId: 'tenant-a', agentId: 'agent-1', memoryType: 'decision', content: 'AI CORE memory', source: 'test' });
  assert.equal(receipt.status, 'STORED');
  const call = transport.calls.find((item) => item.params?.name === 'mempalace_add_drawer');
  assert.ok(call);
  const args = call.params?.arguments as Record<string, unknown>;
  assert.equal(args.room, 'memory:decision');
  assert.equal(args.wing, tenantWing);
});

test('write verifies persistence when the MCP response omits drawer_id', async () => {
  const transport = new FallbackWriteTransport();
  const gateway = new MemPalaceMemoryGateway(transport);
  const receipt = await gateway.write({ tenantId: 'tenant-a', agentId: 'agent-1', memoryType: 'decision', content: 'AI CORE memory', source: 'test' });
  assert.equal(receipt.status, 'STORED');
  assert.equal(receipt.memoryId, deterministicDrawerId(tenantWing, 'memory:decision', 'AI CORE memory'));
  assert.ok(transport.calls.some((item) => item.params?.name === 'mempalace_get_drawer'));
});

test('recall is tenant-scoped and maps MemPalace results', async () => {
  const gateway = new MemPalaceMemoryGateway(new FakeTransport());
  const results = await gateway.recall({ tenantId: 'tenant-a', query: 'AI CORE', limit: 5 });
  assert.equal(results.length, 1);
  assert.equal(results[0].memoryId, deterministicDrawerId(tenantWing, 'memory:decision', 'AI CORE memory'));
  assert.equal(results[0].content, 'AI CORE memory');
});

test('recall derives a deterministic memory id when MCP search omits drawer_id', async () => {
  const gateway = new MemPalaceMemoryGateway(new SearchWithoutDrawerIdTransport());
  const results = await gateway.recall({ tenantId: 'tenant-a', query: 'AI CORE', limit: 5 });
  assert.equal(results.length, 1);
  assert.equal(results[0].memoryId, deterministicDrawerId(tenantWing, 'memory:decision', 'AI CORE memory'));
});

test('read allows the owning tenant and rejects another tenant', async () => {
  const gateway = new MemPalaceMemoryGateway(new FakeTransport());
  const memoryId = deterministicDrawerId(tenantWing, 'memory:decision', 'AI CORE memory');
  const owned = await gateway.read(memoryId, 'tenant-a');
  assert.equal(owned?.tenantId, 'tenant-a');
  assert.equal(await gateway.read(memoryId, 'tenant-b'), null);
});

test('forget verifies tenant ownership before delete', async () => {
  const transport = new FakeTransport();
  const gateway = new MemPalaceMemoryGateway(transport);
  const memoryId = deterministicDrawerId(tenantWing, 'memory:decision', 'AI CORE memory');
  await assert.rejects(() => gateway.forget({ memoryId, tenantId: 'tenant-b', reason: 'test', requestedBy: 'agent-1' }), /MEMORY_NOT_FOUND/);
  assert.equal(transport.calls.filter((item) => item.params?.name === 'mempalace_delete_drawer').length, 0);
});
