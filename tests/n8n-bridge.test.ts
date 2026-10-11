import test from "node:test";
import assert from "node:assert/strict";
import { submitN8nCommand } from "../src/adapters/n8n-bridge";

const ok = (body: unknown = {}) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "content-type": "application/json" },
});

test("n8n command bridge returns unconfigured without a webhook URL and never calls fetch", async () => {
  let called = false;
  const result = await submitN8nCommand("read status", {}, async () => { called = true; return ok(); });
  assert.equal(result.status, "UNCONFIGURED");
  assert.equal(called, false);
});

test("n8n command bridge sends a command only to a configured HTTPS webhook", async () => {
  let requestedUrl = "";
  let sentBody: unknown;
  const result = await submitN8nCommand("Read project status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret-test-path",
  }, async (url, init) => {
    requestedUrl = String(url);
    sentBody = JSON.parse(String(init?.body));
    assert.equal(init?.redirect, "error");
    assert.equal(new Headers(init?.headers).get("content-type"), "application/json");
    return ok({
      accepted: true,
      status: "WAITING_FOR_APPROVAL",
      commandHash: "job-test-1",
      approvalUrl: "https://zeoutsourse.app.n8n.cloud/form-waiting/opaque",
    });
  });
  assert.equal(requestedUrl, "https://zeoutsourse.app.n8n.cloud/webhook/secret-test-path");
  assert.deepEqual(sentBody, { command: "Read project status", source: "jarvis-web" });
  assert.equal(result.status, "WAITING_FOR_APPROVAL");
  assert.equal(result.commandHash, "job-test-1");
  assert.equal(result.approvalUrl, "https://zeoutsourse.app.n8n.cloud/form-waiting/opaque");
});

test("n8n command bridge rejects non-2xx and unverified 200 responses", async () => {
  const failed = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => new Response("unauthorized", { status: 401 }));
  assert.equal(failed.status, "BLOCKED");
  const unverified = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => ok({ message: "Workflow was started" }));
  assert.equal(unverified.status, "BLOCKED");
});

test("n8n command bridge rejects invalid commands and non-HTTPS webhook URLs", async () => {
  const empty = await submitN8nCommand("   ", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => ok());
  assert.equal(empty.status, "BLOCKED");

  const insecure = await submitN8nCommand("Read status", { webhookUrl: "http://localhost:5678/webhook/test" }, async () => ok());
  assert.equal(insecure.status, "BLOCKED");
});

test("n8n command bridge does not expose an unsafe approval URL", async () => {
  const result = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => ok({
    accepted: true,
    status: "WAITING_FOR_APPROVAL",
    approvalUrl: "http://malicious.invalid/approval",
  }));
  assert.equal(result.status, "WAITING_FOR_APPROVAL");
  assert.equal(result.approvalUrl, undefined);
});

test("n8n command bridge does not expose an approval URL from another origin", async () => {
  const result = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => ok({
    accepted: true,
    status: "WAITING_FOR_APPROVAL",
    approvalUrl: "https://evil.example/approval",
  }));
  assert.equal(result.status, "WAITING_FOR_APPROVAL");
  assert.equal(result.approvalUrl, undefined);
});

test("n8n command bridge rejects embedded URL credentials and fragments", async () => {
  const credentialed = await submitN8nCommand("Read status", {
    webhookUrl: "https://user:pass@zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => ok());
  const fragmented = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret#fragment",
  }, async () => ok());
  assert.equal(credentialed.status, "BLOCKED");
  assert.equal(fragmented.status, "BLOCKED");
});

test("n8n command bridge rejects commands over the supported length", async () => {
  const result = await submitN8nCommand("x".repeat(5001), {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/webhook/secret",
  }, async () => ok());
  assert.equal(result.status, "BLOCKED");
});

test("n8n command bridge rejects untrusted hosts and non-webhook paths", async () => {
  let calls = 0;
  const host = await submitN8nCommand("Read status", {
    webhookUrl: "https://example.com/webhook/secret",
  }, async () => { calls += 1; return ok(); });
  const path = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud/form/jarvis",
  }, async () => { calls += 1; return ok(); });
  assert.equal(host.status, "BLOCKED");
  assert.equal(path.status, "BLOCKED");
  assert.equal(calls, 0);
});

test("n8n command bridge rejects non-default HTTPS ports", async () => {
  let called = false;
  const result = await submitN8nCommand("Read status", {
    webhookUrl: "https://zeoutsourse.app.n8n.cloud:444/webhook/secret",
  }, async () => { called = true; return ok(); });
  assert.equal(result.status, "BLOCKED");
  assert.equal(called, false);
});
