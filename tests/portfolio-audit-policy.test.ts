import test from "node:test";
import assert from "node:assert/strict";
import { isPortfolioAuditCommand, isPortfolioAuditFullyVerified } from "../src/core/portfolio-audit-policy";

test("English and Arabic portfolio blocker sweeps route to system health", () => {
  assert.equal(isPortfolioAuditCommand("Audit all projects and blockers"), true);
  assert.equal(isPortfolioAuditCommand("اعمل تدقيق المشاريع والبلوكَرَات"), true);
  assert.equal(isPortfolioAuditCommand("write a birthday card"), false);
});

test("portfolio audit is fully verified only when every requested repository has current evidence", () => {
  assert.equal(isPortfolioAuditFullyVerified([{ status: "verified" }, { status: "verified" }]), true);
  assert.equal(isPortfolioAuditFullyVerified([{ status: "verified" }, { status: "partial" }]), false);
  assert.equal(isPortfolioAuditFullyVerified([{ status: "not_checked" }]), false);
  assert.equal(isPortfolioAuditFullyVerified([]), false);
});
