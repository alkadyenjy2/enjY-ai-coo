export type VerificationStatus = 'VERIFIED' | 'FAILED' | 'NOT_REQUIRED';

export interface VerificationInput {
  state_history: string[];
  evidence: string;
  verificationStatus: VerificationStatus;
  errors: string[];
  actionsExecuted: Array<{ tool: string; status: string; details: string }>;
}

const AUTHORITATIVE_VERIFICATION_TOOLS = new Set([
  'Gmail Verification Tool',
  'Supabase Read Verification',
  'Supabase Verification Tool',
  'Execution Verification Tool',
]);

export function isAuthoritativelyVerified(input: VerificationInput): boolean {
  if (input.verificationStatus !== 'VERIFIED') return false;
  if (input.errors.length > 0) return false;
  if (!input.state_history.includes('EXECUTED') || !input.state_history.includes('VERIFIED')) return false;
  if (!input.evidence.trim()) return false;

  return input.actionsExecuted.some(
    (action) => AUTHORITATIVE_VERIFICATION_TOOLS.has(action.tool) && action.status === 'success',
  );
}
