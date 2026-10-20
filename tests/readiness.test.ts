import test from "node:test";
import assert from "node:assert/strict";
import { isTrustedN8nWebhookConfigured } from "../src/core/readiness.ts";

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
