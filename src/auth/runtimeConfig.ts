export interface SupabaseClientConfig {
  url: string;
  publishableKey: string;
}

const CANONICAL_SUPABASE_URL = 'https://aislifqpskbduzvvbepz.supabase.co';
const CANONICAL_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_goC0jOeqk43NbRSh5LQmug_iAeEgMA0';

type PublicEnv = Record<string, string | undefined>;

export function resolveSupabaseConfig(env: PublicEnv): SupabaseClientConfig {
  const url = String(env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || CANONICAL_SUPABASE_URL)
    .trim()
    .replace(/\\/+$/, '');
  const publishableKey = String(
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    CANONICAL_SUPABASE_PUBLISHABLE_KEY,
  ).trim();
  return { url, publishableKey };
}
