import type { ExecutionLog } from '../types';

type OperationalRecord = {
  id: string;
  timestamp: string;
  command?: string;
  intent?: string;
  final_state_reason?: string;
  verificationStatus?: 'VERIFIED' | 'FAILED' | 'NOT_REQUIRED';
  errors?: string[];
  approvalStatus?: 'AUTO_APPROVED' | 'REQUIRES_HUMAN_APPROVAL' | 'REJECTED';
  project?: string;
  results?: unknown;
};

export function mapOperationalRecordsToExecutionLogs(records: OperationalRecord[]): ExecutionLog[] {
  return records.map((record) => {
    const failed = record.verificationStatus === 'FAILED' || (record.errors?.length ?? 0) > 0;
    const warning = !failed && record.approvalStatus === 'REQUIRES_HUMAN_APPROVAL';

    return {
      id: record.id,
      timestamp: record.timestamp,
      action: `Command Execution: "${(record.command || record.intent || 'Operational command').slice(0, 30)}..."`,
      status: failed ? 'failed' : warning ? 'warning' : 'success',
      details: record.final_state_reason || record.errors?.join('; ') || 'Operational execution recorded by AI CORE.',
      project: record.project,
    };
  });
}
