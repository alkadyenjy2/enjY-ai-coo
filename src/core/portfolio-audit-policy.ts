import type { RepositoryAuditResult } from "./github-portfolio-audit";

export function isPortfolioAuditCommand(value: string): boolean {
  return /portfolio audit|audit all projects|blocker sweep|تدقيق المشاريع|فحص المشاريع|مشاكل المشاريع|blockers/i.test(value);
}

export function isPortfolioAuditFullyVerified(results: Array<Pick<RepositoryAuditResult, "status">>): boolean {
  return results.length > 0 && results.every((result) => result.status === "verified");
}
