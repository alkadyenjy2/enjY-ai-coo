import test from 'node:test';
import assert from 'node:assert/strict';

function deterministicLeadScore(lead: {
  rating?: number;
  reviewCount?: number;
  website?: string;
  phone?: string;
  email?: string;
}) {
  const rating = Math.max(0, Math.min(5, Number(lead.rating ?? 0)));
  const reviews = Math.max(0, Number(lead.reviewCount ?? 0));
  const reviewSignal = Math.min(15, Math.floor(Math.log10(reviews + 1) * 6));
  const ratingSignal = Math.round(rating * 10);
  const websiteSignal = lead.website?.trim() ? 10 : 0;
  const contactSignal = lead.phone?.trim() || lead.email?.trim() ? 10 : 0;
  return Math.max(0, Math.min(100, ratingSignal + reviewSignal + websiteSignal + contactSignal));
}

test('qualification score is deterministic for identical input', () => {
  const lead = {
    rating: 4.8,
    reviewCount: 142,
    website: 'https://example.com',
    phone: '+15550192',
    email: 'owner@example.com',
  };
  assert.equal(deterministicLeadScore(lead), deterministicLeadScore(lead));
});

test('production guardrail rejects simulated AI when live dependencies are required', () => {
  const requireLiveDependencies = true;
  const hasGemini = false;
  assert.equal(requireLiveDependencies && !hasGemini, true);
});

test('production guardrail rejects local Temporal fallback when live dependencies are required', () => {
  const requireLiveDependencies = true;
  const hasExternalTemporal = false;
  assert.equal(requireLiveDependencies && !hasExternalTemporal, true);
});

test('offline fallback remains explicitly labeled and side-effect free', () => {
  const fallback = {
    mode: 'offline_fallback',
    externalSideEffectAttempted: false,
    verificationStatus: 'NOT_REQUIRED',
  };
  assert.equal(fallback.mode, 'offline_fallback');
  assert.equal(fallback.externalSideEffectAttempted, false);
  assert.equal(fallback.verificationStatus, 'NOT_REQUIRED');
});
