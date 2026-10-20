import test from 'node:test';
import assert from 'node:assert/strict';
import { isSecureN8nWebhookConfigured } from '../src/core/readiness.ts';

test('readiness does not claim execution is configured when webhook is missing', () => {
  assert.equal(isSecureN8nWebhookConfigured(undefined), false);
  assert.equal(isSecureN8nWebhookConfigured(''), false);
});

test('readiness accepts only secure HTTPS webhook URLs without embedded credentials or fragments', () => {
  assert.equal(isSecureN8nWebhookConfigured('https://example.n8n.cloud/webhook/opaque'), true);
  assert.equal(isSecureN8nWebhookConfigured('http://example.n8n.cloud/webhook/opaque'), false);
  assert.equal(isSecureN8nWebhookConfigured('https://user:pass@example.n8n.cloud/webhook/opaque'), false);
  assert.equal(isSecureN8nWebhookConfigured('https://example.n8n.cloud/webhook/opaque#fragment'), false);
  assert.equal(isSecureN8nWebhookConfigured('not a URL'), false);
});
