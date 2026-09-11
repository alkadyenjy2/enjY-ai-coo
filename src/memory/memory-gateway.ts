export type MemoryStatus = 'STORED' | 'FORGOTTEN' | 'NOT_FOUND';

export interface MemoryWriteInput {
  tenantId: string;
  agentId: string;
  memoryType: string;
  content: string;
  source: string;
  sourceRef?: string;
  importance?: number;
  sensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
}

export interface MemoryReceipt {
  memoryId: string;
  status: 'STORED';
  createdAt: string;
  provenanceId: string;
}

export interface MemoryRecallInput {
  query: string;
  tenantId: string;
  agentId?: string;
  scope?: string;
  limit?: number;
  filters?: Record<string, string | string[]>;
}

export interface MemoryResult {
  memoryId: string;
  content: string;
  relevance: number;
  source: string;
  provenanceId: string;
  createdAt: string;
  scope?: string;
}

export interface MemoryRecord extends MemoryResult {
  tenantId: string;
  agentId: string;
  memoryType: string;
  sourceRef?: string;
  importance?: number;
  sensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  status: MemoryStatus;
}

export interface ForgetInput {
  memoryId: string;
  tenantId: string;
  reason: string;
  requestedBy: string;
}

export interface ForgetReceipt {
  memoryId: string;
  status: 'FORGOTTEN';
  reason: string;
  requestedBy: string;
  timestamp: string;
  provenanceId: string;
}

export interface MemoryProvenance {
  memoryId: string;
  provenanceId: string;
  source: string;
  sourceRef?: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
  tenantId: string;
  agentId: string;
  transformations: string[];
}

export interface MemoryGateway {
  write(input: MemoryWriteInput): Promise<MemoryReceipt>;
  recall(input: MemoryRecallInput): Promise<MemoryResult[]>;
  read(memoryId: string, tenantId: string): Promise<MemoryRecord | null>;
  forget(input: ForgetInput): Promise<ForgetReceipt>;
  provenance(memoryId: string, tenantId: string): Promise<MemoryProvenance | null>;
}

export class InMemoryMemoryGateway implements MemoryGateway {
  private readonly records = new Map<string, MemoryRecord>();
  private readonly provenanceRecords = new Map<string, MemoryProvenance>();
  private sequence = 0;

  async write(input: MemoryWriteInput): Promise<MemoryReceipt> {
    if (!input.tenantId || !input.agentId || !input.content.trim() || !input.source.trim()) {
      throw new Error('INVALID_MEMORY_WRITE');
    }

    const now = new Date().toISOString();
    const memoryId = `mem-test-${++this.sequence}`;
    const provenanceId = `prov-test-${this.sequence}`;
    const record: MemoryRecord = {
      memoryId,
      content: input.content,
      relevance: 1,
      source: input.source,
      provenanceId,
      createdAt: now,
      tenantId: input.tenantId,
      agentId: input.agentId,
      memoryType: input.memoryType,
      sourceRef: input.sourceRef,
      importance: input.importance,
      sensitivity: input.sensitivity,
      tags: input.tags ?? [],
      status: 'STORED',
    };

    this.records.set(memoryId, record);
    this.provenanceRecords.set(provenanceId, {
      memoryId,
      provenanceId,
      source: input.source,
      sourceRef: input.sourceRef,
      createdAt: now,
      author: input.agentId,
      tenantId: input.tenantId,
      agentId: input.agentId,
      transformations: [],
    });

    return { memoryId, status: 'STORED', createdAt: now, provenanceId };
  }

  async recall(input: MemoryRecallInput): Promise<MemoryResult[]> {
    const query = input.query.trim().toLowerCase();
    if (!query) return [];

    const tokens = query.split(/\s+/).filter(Boolean);
    const results = [...this.records.values()]
      .filter((record) => record.status === 'STORED' && record.tenantId === input.tenantId)
      .filter((record) => !input.agentId || record.agentId === input.agentId)
      .map((record) => {
        const haystack = `${record.content} ${record.tags.join(' ')}`.toLowerCase();
        const matches = tokens.filter((token) => haystack.includes(token)).length;
        return { record, relevance: tokens.length ? matches / tokens.length : 0 };
      })
      .filter(({ relevance }) => relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, Math.min(Math.max(input.limit ?? 10, 1), 50));

    return results.map(({ record, relevance }) => ({
      memoryId: record.memoryId,
      content: record.content,
      relevance,
      source: record.source,
      provenanceId: record.provenanceId,
      createdAt: record.createdAt,
      scope: input.scope,
    }));
  }

  async read(memoryId: string, tenantId: string): Promise<MemoryRecord | null> {
    const record = this.records.get(memoryId);
    if (!record || record.tenantId !== tenantId || record.status !== 'STORED') return null;
    return { ...record, tags: [...record.tags] };
  }

  async forget(input: ForgetInput): Promise<ForgetReceipt> {
    const record = this.records.get(input.memoryId);
    if (!record || record.tenantId !== input.tenantId) throw new Error('MEMORY_NOT_FOUND');

    record.status = 'FORGOTTEN';
    const timestamp = new Date().toISOString();
    return {
      memoryId: input.memoryId,
      status: 'FORGOTTEN',
      reason: input.reason,
      requestedBy: input.requestedBy,
      timestamp,
      provenanceId: record.provenanceId,
    };
  }

  async provenance(memoryId: string, tenantId: string): Promise<MemoryProvenance | null> {
    const record = this.records.get(memoryId);
    if (!record || record.tenantId !== tenantId) return null;
    return this.provenanceRecords.get(record.provenanceId) ?? null;
  }
}
