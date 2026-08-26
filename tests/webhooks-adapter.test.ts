import { createHmac, generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyHighLevelWebhook, verifyWhopWebhook } from '../src/adapters/webhooks.ts';

const whopKey = Buffer.from('synthetic-whop-signing-key-32-bytes!!').toString('base64');
const whopSecret = `ws_${whopKey}`;
const whopBody = JSON.stringify({ type: 'membership.activated', data: { id: 'mem_test_only' } });

function whopSignature(body: string, id: string, timestamp: number): string {
  return `v1,${createHmac('sha256', Buffer.from(whopKey, 'base64'))
    .update(`${id}.${timestamp}.${body}`, 'utf8')
    .digest('base64')}`;
}

test('Whop verification accepts a valid Standard Webhooks signature', () => {
  const id = 'msg_test_only';
  const timestamp = Math.floor(Date.now() / 1000);
  const result = verifyWhopWebhook(
    whopBody,
    { id, timestamp: String(timestamp), signature: whopSignature(whopBody, id, timestamp) },
    whopSecret,
  );
  assert.deepEqual(result, { valid: true, reason: 'verified' });
});

test('Whop verification rejects tampered and stale requests', () => {
  const id = 'msg_test_only';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = whopSignature(whopBody, id, timestamp);
  assert.equal(
    verifyWhopWebhook(`${whopBody} `, { id, timestamp: String(timestamp), signature }, whopSecret).valid,
    false,
  );
  assert.equal(
    verifyWhopWebhook(whopBody, { id, timestamp: String(timestamp - 301), signature }, whopSecret).reason,
    'stale',
  );
});

test('HighLevel verification prefers a valid Ed25519 signature and rejects missing signatures', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const body = JSON.stringify({ type: 'ContactCreate', webhookId: 'ghl_test_only' });
  const signature = sign(null, Buffer.from(body, 'utf8'), privateKey).toString('base64');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  assert.equal(verifyHighLevelWebhook(body, signature, undefined, publicKeyPem, publicKeyPem).valid, true);
  assert.equal(verifyHighLevelWebhook(body, undefined, undefined, publicKeyPem, publicKeyPem).reason, 'missing_headers');
  assert.equal(verifyHighLevelWebhook(`${body} `, signature, undefined, publicKeyPem, publicKeyPem).valid, false);
});
