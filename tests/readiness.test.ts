import test from "node:test";
import assert from "node:assert/strict";
import { getPublicDatabaseFingerprint, isTrustedN8nWebhookConfigured } from "../src/core/readiness.ts";

test("readiness is false when the n8n webhook is missing", () => {
  assert.equal(isTrustedN8nWebhookConfigured(undefined), false);
  assert.equal(isTrustedN8nWebhookConfigured(""), false);
});

test("readiness accepts only the trusted HTTPS production n8n webhook", () => {
  assert.equal(isTrustedN8nWebhookConfigured("https://zeoutsourse.app.n8n.cloud/webhook/opaque"), true);
  assert.equal(isTrustedN8nWebhookConfigured("http://zeoutsourse.app.n8n.cloud/webhook/opaque"), false);
  assert.equal(isTrustedN8nWebhookConfigured("https://example.com/webhook/opaque"), false);
  assert.equal(isTrustedN8nWebhookConfigured("https://zeoutsourse.app.n8n.cloud/form/opaque"), false);
  assert.equal(isTrustedN8nWebhookConfigured("https://user:pass@zeoutsourse.app.n8n.cloud/webhook/opaque"), false);
  assert.equal(isTrustedN8nWebhookConfigured("https://zeoutsourse.app.n8n.cloud:444/webhook/opaque"), false);
  assert.equal(isTrustedN8nWebhookConfigured("https://zeoutsourse.app.n8n.cloud/webhook/opaque#fragment"), false);
  assert.equal(isTrustedN8nWebhookConfigured("https://zeoutsourse.app.n8n.cloud/webhook/opaque?token=x"), false);
});

test("public database fingerprint derives the project ref and reports the latest successful execution", async () => {
  let requestedUrl = "";
  let requestedKey = "";
  const result = await getPublicDatabaseFingerprint(
    { SUPABASE_URL: "https://example-project.supabase.co/", SUPABASE_PUBLISHABLE_KEY: "public-test-key" },
    async (input, init) => {
      requestedUrl = String(input);
      requestedKey = new Headers(init?.headers).get("apikey") || "";
      return new Response(JSON.stringify([{ completed_at: "2026-10-25T12:00:00.000Z", execution_id: "exec-test-1" }]), { status: 200 });
    },
  );
  assert.equal(result.supabase_project_ref, "example-project");
  assert.equal(result.last_successful_write, "2026-10-25T12:00:00.000Z");
  assert.equal(result.last_execution_id, "exec-test-1");
  assert.match(requestedUrl, /type=eq\.ai_core_execution/);
  assert.match(requestedUrl, /status=eq\.success/);
  assert.equal(requestedKey, "public-test-key");
});

test("public database fingerprint never exposes database errors or secrets when RLS denies the read", async () => {
  const result = await getPublicDatabaseFingerprint(
    { SUPABASE_URL: "https://example-project.supabase.co", SUPABASE_PUBLISHABLE_KEY: "public-test-key", SUPABASE_SECRET_KEY: "must-not-be-used" },
    async (_input, init) => {
      assert.equal(new Headers(init?.headers).get("apikey"), "public-test-key");
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer public-test-key");
      return new Response("permission denied detail", { status: 403 });
    },
  );
  assert.deepEqual(result, { supabase_project_ref: "example-project", last_successful_write: null, last_execution_id: null });
});

test("public database fingerprint supports an explicit project ref and degrades safely without credentials", async () => {
  const result = await getPublicDatabaseFingerprint({ SUPABASE_URL: "https://custom.example", SUPABASE_PROJECT_REF: "explicit-ref" });
  assert.deepEqual(result, { supabase_project_ref: "explicit-ref", last_successful_write: null, last_execution_id: null });
});
