import test from "node:test";
import assert from "node:assert/strict";

process.env.VERCEL = "1";

const { resolveCommandVerificationStatus } = await import("../server.ts");

test("REPORTING connector execution becomes terminal VERIFIED when a real connector action succeeded", () => {
  const status = resolveCommandVerificationStatus(
    "REPORTING",
    [{ tool: "Connector Health Tool", status: "success" }],
    "NOT_REQUIRED",
  );

  assert.equal(status, "VERIFIED");
});

test("non-reporting durable handoffs keep NOT_REQUIRED until their executor completes", () => {
  const status = resolveCommandVerificationStatus(
    "EXECUTION",
    [{ tool: "BrowserSkill Durable Execution", status: "queued" }],
    "NOT_REQUIRED",
  );

  assert.equal(status, "NOT_REQUIRED");
});
