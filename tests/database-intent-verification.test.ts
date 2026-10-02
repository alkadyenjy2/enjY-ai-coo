import test from "node:test";
import assert from "node:assert/strict";

process.env.VERCEL = "1";

const { classifyCommand, getReportingVerificationStatus, getSupabaseQueryActionStatus, getSupabaseReadApiKey, getDatabaseVerificationStatus, buildSupabaseReadUrl } = await import("../server.ts");

test("routes explicit Supabase leads reads to DATABASE", () => {
  assert.equal(
    classifyCommand("Read the ZE Outsource leads from Supabase and return the current lead records."),
    "DATABASE",
  );
});

test("Supabase non-2xx responses are recorded as failed actions", () => {
  assert.equal(getSupabaseQueryActionStatus(403, { message: "permission denied" }), "failed");
  assert.equal(getSupabaseQueryActionStatus(200, [{ id: 1 }]), "success");
});

test("server-side Supabase secret is preferred for read access", () => {
  assert.equal(getSupabaseReadApiKey({ SUPABASE_SECRET_KEY: "server-secret", SUPABASE_ANON_KEY: "anon-key" }), "server-secret");
  assert.equal(getSupabaseReadApiKey({ SUPABASE_ANON_KEY: "anon-key" }), "anon-key");
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
      },
    ]),
    "VERIFIED",
  );
});


test("tenant-scoped leads reads include the server-authorized organization filter", () => {\n  assert.equal(\n    buildSupabaseReadUrl("https://example.supabase.co", "leads", "*", "5c3d0b58-f2dd-4677-be24-2bfc06da19cb"),\n    "https://example.supabase.co/rest/v1/leads?select=*&organization_id=eq.5c3d0b58-f2dd-4677-be24-2bfc06da19cb",\n  );\n});\n\ntest("HTTP 200 Supabase error payload is FAILED", () => {\n  assert.equal(\n    getDatabaseVerificationStatus(200, { code: "42501", message: "permission denied for table leads" }),\n    "FAILED",\n  );\n  assert.equal(getDatabaseVerificationStatus(200, []), "VERIFIED");\n});\n\ntest("successful DATABASE read is VERIFIED", () => {
  assert.equal(getDatabaseVerificationStatus(200, []), "VERIFIED");
  assert.equal(getDatabaseVerificationStatus(201, [{ id: "lead-1" }]), "VERIFIED");
});

test("failed DATABASE read is FAILED", () => {
  assert.equal(getDatabaseVerificationStatus(403, { code: "42501", message: "permission denied" }), "FAILED");
  assert.equal(getDatabaseVerificationStatus(500, { message: "server error" }), "FAILED");
});
