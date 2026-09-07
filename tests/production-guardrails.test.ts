import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQualificationScore, geminiGenerateContentActivity, recordMemoryActivity } from '../temporal-proof/activities.ts';

const originalNodeEnv = process.env.NODE_ENV;
const originalRequireLive = process.env.REQUIRE_LIVE_DEPENDENCIES;
const originalGemini = process.env.GEMINI_API_KEY;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalSupabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

function restoreEnv() {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
  if (originalRequireLive === undefined) delete process.env.REQUIRE_LIVE_DEPENDENCIES; else process.env.REQUIRE_LIVE_DEPENDENCIES = originalRequireLive;
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
  if (originalSupabaseUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalSupabaseUrl;
  if (originalSupabaseKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = originalSupabaseKey;
}

test.afterEach(restoreEnv);

test('qualification scoring is deterministic and bounded', () => {
  const lead = {
    id: 'lead-1',
    businessName: 'Apex Roofing',
    ownerName: 'Mark Henderson',
    phone: '+15550192',
    email: 'mark@example.com',
    website: 'https://example.com',
    city: 'Dallas',
    state: 'TX',
    rating: 4.8,
    reviewCount: 142,
  };
  const first = calculateQualificationScore(lead);
  const second = calculateQualificationScore(lead);
  assert.equal(first, second);
  assert.ok(first >= 0 && first <= 100);
});

test('Gemini activity fails closed when live dependencies are required and credentials are absent', async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(
    () => geminiGenerateContentActivity('production guardrail test'),
    /GEMINI_LIVE_DEPENDENCY_UNAVAILABLE/,
  );
});

test('Gemini simulation remains available only outside production mode', async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.REQUIRE_LIVE_DEPENDENCIES;
  delete process.env.GEMINI_API_KEY;
  const result = await geminiGenerateContentActivity('offline test');
  assert.match(result, /GEMINI_SIMULATION/);
});

test('memory activity fails closed instead of inventing durable persistence in production', async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  await assert.rejects(
    () => recordMemoryActivity({ testId: 'production-memory-test', finalState: 'COMPLETED', history: ['COMPLETED'] }),
    /DURABLE_MEMORY_UNAVAILABLE/,
  );
});
