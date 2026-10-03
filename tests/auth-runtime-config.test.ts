import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveSupabaseConfig } from '../src/auth/runtimeConfig';

test('JARVIS client has safe public Supabase configuration fallback', () => {
  const config = resolveSupabaseConfig({});
  assert.equal(config.url, 'https://aislifqpskbduzvvbepz.supabase.co');
  assert.equal(config.publishableKey, 'sb_publishable_goC0jOeqk43NbRSh5LQmug_iAeEgMA0');
});

test('explicit public Supabase env overrides fallback', () => {
  const config = resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co/',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  });
  assert.equal(config.url, 'https://example.supabase.co');
  assert.equal(config.publishableKey, 'sb_publishable_test');
});
