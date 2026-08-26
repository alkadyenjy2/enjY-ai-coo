import { createHmac, createVerify, timingSafeEqual, verify as verifySignature } from 'node:crypto';

export type WebhookVerification = {
  valid: boolean;
  reason: 'verified' | 'missing_secret' | 'missing_headers' | 'stale' | 'invalid_signature' | 'invalid_payload';
};

function equalBytes(expected: Buffer, received: Buffer): boolean {
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function verifyWhopWebhook(
  rawBody: string,
  headers: { id?: string; timestamp?: string; signature?: string },
  secret: string | undefined,
  nowMs = Date.now(),
): WebhookVerification {
  if (!secret) return { valid: false, reason: 'missing_secret' };
  const id = headers.id?.trim() || '';
  const timestampValue = headers.timestamp?.trim() || '';
  const signatureHeader = headers.signature?.trim() || '';
  const timestamp = Number(timestampValue);
  if (!id || !timestampValue || !signatureHeader) return { valid: false, reason: 'missing_headers' };
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(nowMs / 1000) - timestamp) > 300) {
    return { valid: false, reason: 'stale' };
  }

  const encodedKey = secret.startsWith('ws_') ? secret.slice(3) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(encodedKey, 'base64');
  } catch {
    return { valid: false, reason: 'missing_secret' };
  }
  if (key.length === 0) return { valid: false, reason: 'missing_secret' };

  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`, 'utf8')
    .digest();
  const valid = signatureHeader.split(/\s+/).some((candidate) => {
    const [version, encodedSignature] = candidate.split(',', 2);
    if (version !== 'v1' || !encodedSignature) return false;
    try {
      return equalBytes(expected, Buffer.from(encodedSignature, 'base64'));
    } catch {
      return false;
    }
  });
  return valid ? { valid: true, reason: 'verified' } : { valid: false, reason: 'invalid_signature' };
}

export function verifyHighLevelWebhook(
  rawBody: string,
  currentSignature: string | undefined,
  legacySignature: string | undefined,
  currentPublicKey: string,
  legacyPublicKey: string,
): WebhookVerification {
  if (!currentSignature && !legacySignature) return { valid: false, reason: 'missing_headers' };
  try {
    if (currentSignature) {
      const valid = verifySignature(null, Buffer.from(rawBody, 'utf8'), currentPublicKey, Buffer.from(currentSignature, 'base64'));
      return valid ? { valid: true, reason: 'verified' } : { valid: false, reason: 'invalid_signature' };
    }

    const verifier = createVerify('SHA256');
    verifier.update(rawBody, 'utf8');
    verifier.end();
    const valid = verifier.verify(legacyPublicKey, legacySignature!, 'base64');
    return valid ? { valid: true, reason: 'verified' } : { valid: false, reason: 'invalid_signature' };
  } catch {
    return { valid: false, reason: 'invalid_signature' };
  }
}
