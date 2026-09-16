import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeJarvisRoute } from '../src/utils/jarvis-route';

test('summarizes the verified free-first route for the command center', () => {
  const summary = summarizeJarvisRoute('Research scholarships and verify official sources.');

  assert.equal(summary.policy, 'FREE FIRST');
  assert.equal(summary.primary, 'OpenRouter');
  assert.deepEqual(summary.fallbacks, ['Google Gemini API', 'Groq', 'Mistral API', 'Cerebras API', 'Hugging Face Inference Providers']);
  assert.equal(summary.status, 'READY');
});

test('does not expose unverified providers as an executable route', () => {
  const summary = summarizeJarvisRoute('Use DeepSeek if possible.');

  assert.equal(summary.status, 'READY');
  assert.ok(!summary.primary.toLowerCase().includes('deepseek'));
  assert.ok(!summary.fallbacks.some((name) => name.toLowerCase().includes('deepseek')));
});
