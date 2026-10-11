const READ_ONLY_CLASSES = new Set([
  'SYSTEM_HEALTH',
  'REPORTING',
  'SCHOLARSHIP_DISCOVERY',
]);

/**
 * Read-only diagnostics and verified discovery belong on the app's deterministic
 * route, not the n8n workflow that persists a human-approval job.
 */
export function shouldRouteN8nApproval(commandClass: string): boolean {
  return !READ_ONLY_CLASSES.has(String(commandClass || '').trim().toUpperCase());
}
