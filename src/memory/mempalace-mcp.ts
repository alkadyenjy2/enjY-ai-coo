import { createHash } from 'node:crypto';
import { MemoryGateway, MemoryProvenance, MemoryRecallInput, MemoryRecord, MemoryResult, MemoryWriteInput, MemoryReceipt, ForgetInput, ForgetReceipt } from './memory-gateway.js';

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export interface MemPalaceMcpTransport {
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
}

export class MemPalaceMcpHttpTransport implements MemPalaceMcpTransport {
  private nextId = 1;
  private initialized = false;

  constructor(private readonly endpoint: string, private readonly token?: string) {}

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.initialized && method !== 'initialize') {
      const init = await this.call<JsonRpcResponse>('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'enjY-ai-coo', version: '1.0' },
      });
      if (init.error) throw new Error(`MEMPALACE_MCP_${init.error.code}: ${init.error.message}`);
      this.initialized = true;
      await this.notify('notifications/initialized');
    }

    const id = this.nextId++;
    const response = await this.request({ jsonrpc: '2.0', id, method, params });
    if (response.error) throw new Error(`MEMPALACE_MCP_${response.error.code}: ${response.error.message}`);
    return response.result as T;
  }

  private async notify(method: string, params: Record<string, unknown> = {}): Promise<void> {
    await this.request({ jsonrpc: '2.0', method, params });
  }

  private async request(body: Record<string, unknown>): Promise<JsonRpcResponse> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`MEMPALACE_HTTP_${response.status}`);
    if (response.status === 202) return { jsonrpc: '2.0' };
    return (await response.json()) as JsonRpcResponse;
  }
}

type ToolCallResult = {
  content?: Array<{ type?: string; text?: string }>;
  structuredContent?: unknown;
  result?: unknown;
  isError?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function unwrapToolResult(result: ToolCallResult): Record<string, unknown> {
  if (result.isError) throw new Error('MEMPALACE_TOOL_ERROR');

  const structured = asRecord(result.structuredContent);
  if (structured) return structured;

  const direct = asRecord(result.result);
  if (direct) return direct;

  const text = (result.content ?? [])
    .filter((item) => item.type === 'text' && item.text)
    .map((item) => item.text)
    .join('');
  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { text };
  }
}

function scopedWing(tenantId: string): string {
  return `ai-core:${createHash('sha256').update(tenantId).digest('hex').slice(0, 24)}`;
}

function provenanceId(tenantId: string, memoryId: string): string {
  return `mempalace:${createHash('sha256').update(`${tenantId}:${memoryId}`).digest('hex').slice(0, 32)}`;
}

export class MemPalaceMemoryGateway implements MemoryGateway {
  constructor(private readonly transport: MemPalaceMcpTransport) {}

  private async tool<T extends Record<string, unknown>>(name: string, arguments_: Record<string, unknown>): Promise<T> {
    const raw = await this.transport.call<ToolCallResult>('tools/call', { name, arguments: arguments_ });
    return unwrapToolResult(raw) as T;
  }

  async write(input: MemoryWriteInput): Promise<MemoryReceipt> {
    if (!input.tenantId || !input.agentId || !input.content.trim() || !input.source.trim()) throw new Error('INVALID_MEMORY_WRITE');
    const wing = scopedWing(input.tenantId);
    const room = `memory:${input.memoryType || 'general'}`;
    const result = await this.tool<{ success?: boolean; drawer_id?: string }>('mempalace_add_drawer', {
      wing,
      room,
      content: input.content,
      source_file: `ai-core://memory/${createHash('sha256').update(`${input.tenantId}:${input.agentId}:${input.source}`).digest('hex').slice(0, 32)}`,
      added_by: input.agentId,
    });

    // MemPalace 3.9.x can return a successful MCP tool result whose human-facing
    // content does not expose drawer_id. Treat the write as incomplete until we
    // can independently locate the exact record in the same tenant-scoped room.
    let memoryId = typeof result.drawer_id === 'string' ? result.drawer_id : undefined;
    if (!memoryId) {
      const verified = await this.tool<{
        results?: Array<{ text?: string; wing?: string; room?: string; drawer_id?: string; similarity?: number }>;
      }>('mempalace_search', {
        query: input.content,
        limit: 5,
        wing,
        room,
      });
      const exact = (verified.results ?? []).find((item) =>
        item.drawer_id && item.wing === wing && item.room === room && item.text === input.content,
      );
      memoryId = exact?.drawer_id;
    }

    if (!memoryId) throw new Error('MEMPALACE_WRITE_NO_DRAWER_ID');
    return { memoryId, status: 'STORED', createdAt: new Date().toISOString(), provenanceId: provenanceId(input.tenantId, memoryId) };
  }

  async recall(input: MemoryRecallInput): Promise<MemoryResult[]> {
    if (!input.query.trim()) return [];
    const result = await this.tool<{ results?: Array<{ text?: string; wing?: string; room?: string; source_file?: string; similarity?: number; drawer_id?: string }> }>('mempalace_search', {
      query: input.query,
      limit: Math.min(Math.max(input.limit ?? 10, 1), 50),
      wing: scopedWing(input.tenantId),
      ...(input.scope ? { room: input.scope } : {}),
    });
    return (result.results ?? []).map((item) => {
      const memoryId = item.drawer_id ?? `${item.wing ?? ''}:${item.room ?? ''}:${item.source_file ?? ''}`;
      return { memoryId, content: item.text ?? '', relevance: item.similarity ?? 0, source: item.source_file ?? 'mempalace', provenanceId: provenanceId(input.tenantId, memoryId), createdAt: new Date().toISOString(), scope: item.room };
    });
  }

  async read(memoryId: string, tenantId: string): Promise<MemoryRecord | null> {
    const result = await this.tool<{ drawer_id?: string; content?: string; wing?: string; room?: string; metadata?: Record<string, unknown> }>('mempalace_get_drawer', { drawer_id: memoryId });
    if (!result.drawer_id || result.wing !== scopedWing(tenantId)) return null;
    const metadata = result.metadata ?? {};
    return {
      memoryId,
      content: result.content ?? '',
      relevance: 1,
      source: typeof metadata.source_file === 'string' ? metadata.source_file : 'mempalace',
      provenanceId: provenanceId(tenantId, memoryId),
      createdAt: typeof metadata.filed_at === 'string' ? metadata.filed_at : new Date().toISOString(),
      scope: result.room,
      tenantId,
      agentId: typeof metadata.added_by === 'string' ? metadata.added_by : 'mempalace',
      memoryType: result.room?.replace(/^memory:/, '') ?? 'general',
      importance: undefined,
      sensitivity: undefined,
      tags: [],
      status: 'STORED',
      sourceRef: undefined,
    };
  }

  async forget(input: ForgetInput): Promise<ForgetReceipt> {
    const existing = await this.read(input.memoryId, input.tenantId);
    if (!existing) throw new Error('MEMORY_NOT_FOUND');
    await this.tool('mempalace_delete_drawer', { drawer_id: input.memoryId });
    return { memoryId: input.memoryId, status: 'FORGOTTEN', reason: input.reason, requestedBy: input.requestedBy, timestamp: new Date().toISOString(), provenanceId: existing.provenanceId };
  }

  async provenance(memoryId: string, tenantId: string): Promise<MemoryProvenance | null> {
    const existing = await this.read(memoryId, tenantId);
    if (!existing) return null;
    return { memoryId, provenanceId: existing.provenanceId, source: existing.source, sourceRef: existing.sourceRef, createdAt: existing.createdAt, author: existing.agentId, tenantId, agentId: existing.agentId, transformations: [] };
  }
}
