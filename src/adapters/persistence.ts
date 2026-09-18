import { createHash } from 'node:crypto';
import { getPersistenceContext } from './request-context';
import type { FeedbackEntry } from './memory';

export interface OperationalRecordLike {
  id: string;
  timestamp: string;
  command: string;
  project: string;
  intent: string;
  tool: string;
  selectedTools: string[];
  actionsExecuted: Array<{ tool: string; status: string; details: string }>;
  results: any;
  state_history: string[];
  evidence: string;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'NOT_REQUIRED';
  final_state_reason: string;
  errors: string[];
  approvalStatus: 'AUTO_APPROVED' | 'REQUIRES_HUMAN_APPROVAL' | 'REJECTED';
}

export interface PersistenceResult {
  persisted: boolean;
  source: 'supabase' | 'memory';
  recordId?: string;
  error?: string;
}

interface SupabaseConfig {
  url: string;
  key: string;
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  if (!url || !key || !url.startsWith('http')) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

function getAuthenticatedPersistenceHeaders(config: SupabaseConfig, accessToken: string): Record<string, string> {
  return {
    apikey: config.key,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function safeMetadata(record: OperationalRecordLike) {
  return {
    command: record.command,
    project: record.project,
    intent: record.intent,
    tool: record.tool,
    selectedTools: record.selectedTools,
    actionsExecuted: record.actionsExecuted,
    results: record.results,
    state_history: record.state_history,
    evidence: record.evidence,
    verificationStatus: record.verificationStatus,
    final_state_reason: record.final_state_reason,
    errors: record.errors,
    approvalStatus: record.approvalStatus,
  };
}

function auditStatus(record: OperationalRecordLike): 'success' | 'warning' | 'failed' {
  if (record.verificationStatus === 'FAILED' || record.errors.length > 0) return 'failed';
  if (record.approvalStatus === 'REQUIRES_HUMAN_APPROVAL') return 'warning';
  return 'success';
}

export async function persistOperationalRecord(record: OperationalRecordLike): Promise<PersistenceResult> {
  const config = getSupabaseConfig();
  if (!config) return { persisted: false, source: 'memory', error: 'Supabase runtime credentials are not configured.' };

  const context = getPersistenceContext();
  if (!context) {
    return {
      persisted: false,
      source: 'memory',
      error: 'Authenticated tenant persistence context is unavailable.',
    };
  }

  const metadata = safeMetadata(record);
  const body = {
    organization_id: context.organizationId,
    user_id: context.userId,
    title: `AI CORE ${record.intent} — ${record.verificationStatus}`,
    description: record.final_state_reason,
    type: 'ai_core_execution',
    status: auditStatus(record),
    event_metadata: metadata,
    workflow_name: 'Core AI Agent',
    execution_id: record.id,
    provider: 'ai_core_runtime',
    payload_hash: createHash('sha256').update(JSON.stringify(metadata)).digest('hex'),
    error_code: record.errors.length > 0 ? 'AGENT_EXECUTION_ERROR' : null,
    error_message: record.errors.length > 0 ? record.errors.join('; ').slice(0, 2000) : null,
    completed_at: record.timestamp,
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: { ...getAuthenticatedPersistenceHeaders(config, context.accessToken), Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        persisted: false,
        source: 'memory',
        error: `Supabase audit_logs write returned HTTP ${response.status}.`,
      };
    }

    const data = await response.json().catch(() => []);
    const recordId = Array.isArray(data) && data[0]?.id ? String(data[0].id) : undefined;
    return { persisted: true, source: 'supabase', recordId };
  } catch (error: any) {
    return {
      persisted: false,
      source: 'memory',
      error: `Supabase audit_logs write failed: ${error?.message || 'unknown error'}`,
    };
  }
}

export async function persistLearningFeedback(entry: FeedbackEntry): Promise<PersistenceResult> {
  const config = getSupabaseConfig();
  if (!config) return { persisted: false, source: 'memory', error: 'Supabase runtime credentials are not configured.' };

  const context = getPersistenceContext();
  if (!context) {
    return { persisted: false, source: 'memory', error: 'Authenticated tenant persistence context is unavailable.' };
  }

  const payload = {
    id: entry.id,
    workflowId: entry.workflowId,
    userRating: entry.userRating,
    feedbackText: entry.feedbackText,
    evidenceHash: entry.evidenceHash,
    timestamp: entry.timestamp,
  };

  const body = {
    organization_id: context.organizationId,
    user_id: context.userId,
    title: `AI CORE learning feedback — ${entry.workflowId}`,
    description: entry.feedbackText || 'AI Core learning feedback event.',
    type: 'ai_core_learning',
    status: 'success',
    event_metadata: { learningType: 'feedback', feedback: payload },
    workflow_name: 'Core AI Agent Learning',
    execution_id: entry.id,
    provider: 'ai_core_learning',
    payload_hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
    completed_at: entry.timestamp,
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: { ...getAuthenticatedPersistenceHeaders(config, context.accessToken), Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { persisted: false, source: 'memory', error: `Supabase learning write returned HTTP ${response.status}.` };
    }
    const data = await response.json().catch(() => []);
    const recordId = Array.isArray(data) && data[0]?.id ? String(data[0].id) : undefined;
    return { persisted: true, source: 'supabase', recordId };
  } catch (error: any) {
    return { persisted: false, source: 'memory', error: `Supabase learning write failed: ${error?.message || 'unknown error'}` };
  }
}

export async function fetchPersistedLearningFeedback(limit = 100): Promise<{ entries: FeedbackEntry[]; source: 'supabase' | 'memory'; error?: string }> {
  const config = getSupabaseConfig();
  if (!config) return { entries: [], source: 'memory', error: 'Supabase runtime credentials are not configured.' };

  const context = getPersistenceContext();
  if (!context) return { entries: [], source: 'memory', error: 'Authenticated tenant persistence context is unavailable.' };

  const query = new URLSearchParams({
    select: 'event_metadata,created_at',
    organization_id: `eq.${context.organizationId}`,
    type: 'eq.ai_core_learning',
    order: 'created_at.asc',
    limit: String(Math.min(Math.max(limit, 1), 500)),
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/audit_logs?${query.toString()}`, {
      headers: getAuthenticatedPersistenceHeaders(config, context.accessToken),
    });
    if (!response.ok) return { entries: [], source: 'memory', error: `Supabase learning read returned HTTP ${response.status}.` };

    const rows = await response.json();
    const entries: FeedbackEntry[] = Array.isArray(rows)
      ? rows
          .filter((row: any) => row?.event_metadata?.learningType === 'feedback' && row?.event_metadata?.feedback)
          .map((row: any) => row.event_metadata.feedback as FeedbackEntry)
      : [];
    return { entries, source: 'supabase' };
  } catch (error: any) {
    return { entries: [], source: 'memory', error: `Supabase learning read failed: ${error?.message || 'unknown error'}` };
  }
}

export async function fetchPersistedOperationalRecords(limit = 50): Promise<{ records: OperationalRecordLike[]; source: 'supabase' | 'memory'; error?: string }> {
  const config = getSupabaseConfig();
  if (!config) return { records: [], source: 'memory', error: 'Supabase runtime credentials are not configured.' };

  const context = getPersistenceContext();
  if (!context) {
    return { records: [], source: 'memory', error: 'Authenticated tenant persistence context is unavailable.' };
  }

  const query = new URLSearchParams({
    select: 'id,description,status,event_metadata,workflow_name,execution_id,provider,error_code,error_message,completed_at,created_at',
    organization_id: `eq.${context.organizationId}`,
    type: 'eq.ai_core_execution',
    order: 'created_at.desc',
    limit: String(Math.min(Math.max(limit, 1), 100)),
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/audit_logs?${query.toString()}`, {
      headers: getAuthenticatedPersistenceHeaders(config, context.accessToken),
    });

    if (!response.ok) {
      return { records: [], source: 'memory', error: `Supabase audit_logs read returned HTTP ${response.status}.` };
    }

    const rows = await response.json();
    const records: OperationalRecordLike[] = Array.isArray(rows)
      ? rows.map((row: any) => ({
          id: String(row.execution_id || row.id),
          timestamp: row.completed_at || row.created_at || new Date().toISOString(),
          command: row.event_metadata?.command || '',
          project: row.event_metadata?.project || '',
          intent: row.event_metadata?.intent || '',
          tool: row.event_metadata?.tool || '',
          selectedTools: Array.isArray(row.event_metadata?.selectedTools) ? row.event_metadata.selectedTools : [],
          actionsExecuted: Array.isArray(row.event_metadata?.actionsExecuted) ? row.event_metadata.actionsExecuted : [],
          results: row.event_metadata?.results || {},
          state_history: Array.isArray(row.event_metadata?.state_history) ? row.event_metadata.state_history : [],
          evidence: row.event_metadata?.evidence || '',
          verificationStatus: row.event_metadata?.verificationStatus || (row.status === 'failed' ? 'FAILED' : 'NOT_REQUIRED'),
          final_state_reason: row.description || row.event_metadata?.final_state_reason || '',
          errors: Array.isArray(row.event_metadata?.errors) ? row.event_metadata.errors : [],
          approvalStatus: row.event_metadata?.approvalStatus || 'AUTO_APPROVED',
        }))
      : [];

    return { records, source: 'supabase' };
  } catch (error: any) {
    return { records: [], source: 'memory', error: `Supabase audit_logs read failed: ${error?.message || 'unknown error'}` };
  }
}
