export function buildOperationalHistoryUrl(organizationId: string, limit = 50): string {
  const normalizedOrganizationId = organizationId.trim();
  if (!normalizedOrganizationId) {
    throw new Error("organization_id is required.");
  }

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 100) : 50;
  const params = new URLSearchParams({
    limit: String(safeLimit),
    organization_id: normalizedOrganizationId,
  });
  return `/api/agent/history?${params.toString()}`;
}
