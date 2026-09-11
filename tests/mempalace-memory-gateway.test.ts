import assert from 'node:assert/strict';
import test from 'node:test';
import { MemPalaceMemoryGateway, MemPalaceMcpTransport } from '../src/memory/mempalace-mcp.ts';

class FakeTransport implements MemPalaceMcpTransport {
  calls: Array<{ method: string; params?: Record<string, unknown> }> = [];
  private drawer = {
    drawer_id: 'drawer-1',
    content: 'AI CORE memory',
    wing: 'ai-core:80a707af7dc77ee1228f9127',
    room: 'memory:decision',
    metadata: { added_by: 'agent-1', source_file: 'ai-core://memory/prov' },
  };

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    this.calls.push({ method, params });
    if (method !== 'tools/call') return { serverInfo: { name: 'mempalace' } } as T;
    const name = params.name;
    if (name === 'mempalace_add_drawer') return { content: [{ type: 'text', text: JSON.stringify({ success: true, drawer_id: 'drawer-1' }) }] } as T;
    if (name === 'mempalace_search') return { content: [{ type: 'text', text: JSON.stringify({ results: [{ drawer_id: 'drawer-1', text: 'AI CORE memory', wing: 'ai-core:80a707af7dc77ee1228f9127', room: 'memory:decision', source_file: 'ai-core://memory/prov', similarity: 0.91 }] }) }] } as T;
    if (name === 'mempalace_get_drawer') {
      const drawerId = (params.arguments as Record<string, unknown>).drawer_id;
      return { content: [{ type: 'text', text: JSON.stringify(drawerId === 'drawer-1' ? this.drawer : {}) }] } as T;
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

test('writes into a tenant-scoped MemPalace wing', async () => {
  const transport = new FakeTransport();
  const gateway = new MemPalaceMemoryGateway(transport);
  const receipt = await gateway.write({ tenantId: 'tenant-a', agentId: 'agent-1', memoryType: 'decision', content: 'AI CORE memory', source: 'test' });
  assert.equal(receipt.status, 'STORED');
  const call = transport.calls.find((item) => item.params?.name === 'mempalace_add_drawer');
  assert.ok(call);
  const args = call.params?.arguments as Record<string, unknown>;
  assert.equal(args.room, 'memory:decision');
  assert.equal(args.wing, 'ai-core:80a707af7dc77ee1228f9127');
});

test('write verifies persistence when the MCP response omits drawer_id', async () => {
  const transport = new FallbackWriteTransport();
  const gateway = new MemPalaceMemoryGateway(transport);
  const receipt = await gateway.write({ tenantId: 'tenant-a', agentId: 'agent-1', memoryType: 'decision', content: 'AI CORE memory', source: 'test' });
  assert.equal(receipt.status, 'STORED');
  assert.equal(receipt.memoryId, 'drawer-1');
  assert.ok(transport.calls.some((item) => item.params?.name === 'mempalace_search'));
});

test('recall is tenant-scoped and maps MemPalace results', async () => {
  const gateway = new MemPalaceMemoryGateway(new FakeTransport());
  const results = await gateway.recall({ tenantId: 'tenant-a', query: 'AI CORE', limit: 5 });
  assert.equal(results.length, 1);
  assert.equal(results[0].memoryId, 'drawer-1');
  assert.equal(results[0].content, 'AI CORE memory');
});

test('read allows the owning tenant and rejects another tenant', async () => {
  const gateway = new MemPalaceMemoryGateway(new FakeTransport());
  const owned = await gateway.read('drawer-1', 'tenant-a');
  assert.equal(owned?.tenantId, 'tenant-a');
  assert.equal(await gateway.read('drawer-1', 'tenant-b'), null);
});

test('forget verifies tenant ownership before delete', async () => {
  const transport = new FakeTransport();
  const gateway = new MemPalaceMemoryGateway(transport);
  await assert.rejects(() => gateway.forget({ memoryId: 'drawer-1', tenantId: 'tenant-b', reason: 'test', requestedBy: 'agent-1' }), /MEMORY_NOT_FOUND/);
  assert.equal(transport.calls.filter((item) => item.params?.name === 'mempalace_delete_drawer').length, 0);
});
