import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripeAdapter } from '../src/adapters/stripe.ts';

const secret = 'synthetic-stripe-signing-secret-for-tests';
const payload = JSON.stringify({
  id: 'evt_test_only',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_only', amount_total: 1000 } },
});

function signatureFor(body: string, timestamp: number): string {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

test('Stripe webhook rejects an unsigned payload', () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    const result = stripeAdapter.verifyAndProcessWebhook(payload, '');
    assert.equal(result.valid, false);
    assert.equal(result.payload, null);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previous;
  }
});

test('Stripe webhook accepts a valid current signature', () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const result = stripeAdapter.verifyAndProcessWebhook(payload, signatureFor(payload, timestamp));
    assert.equal(result.valid, true);
    assert.equal(result.eventType, 'checkout.session.completed');
    assert.equal(result.payload.id, 'cs_test_only');
  } finally {
    if (previous === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previous;
  }
});

test('Stripe webhook rejects tampered and stale signatures', () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    const now = Math.floor(Date.now() / 1000);
    const tampered = stripeAdapter.verifyAndProcessWebhook(
      `${payload} `,
      signatureFor(payload, now),
    );
    const stale = stripeAdapter.verifyAndProcessWebhook(payload, signatureFor(payload, now - 301));
    assert.equal(tampered.valid, false);
    assert.equal(stale.valid, false);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previous;
  }
});
