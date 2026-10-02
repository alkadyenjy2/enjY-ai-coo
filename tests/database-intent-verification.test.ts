import test from "node:test";
import assert from "node:assert/strict";

process.env.VERCEL = "1";

const { classifyCommand, getReportingVerificationStatus } = await import("../server.ts");

test("routes explicit Supabase leads reads to DATABASE", () => {
  assert.equal(
    classifyCommand("Read the ZE Outsource leads from Supabase and return the current lead records."),
    "DATABASE",
  );
});

test("REPORTING without live execution evidence is not VERIFIED", () => {
  assert.equal(getReportingVerificationStatus([]), "NOT_REQUIRED");
});

test("REPORTING may be VERIFIED when a real connector action produced evidence", () => {
  assert.equal(
    getReportingVerificationStatus([
      {
        tool: "Connector Health Tool",
        status: "success",
        details: "Probed connector 'supabase': REAL_LIVE",
      },
    ]),
    "VERIFIED",
  );
});
