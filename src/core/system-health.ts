export interface SystemHealthProbeInput {
  supabaseUrl: string;
  supabaseApiKey: string;
  openaiConfigured: boolean;
  geminiConfigured: boolean;
  metaConfigured: boolean;
}

export interface SystemHealthProbe {
  connector: 'supabase';
  status: 'REAL_LIVE' | 'UNCONFIGURED';
  providerFallback: 'openai_configured' | 'gemini_configured' | 'meta_configured' | 'none';
  evidence: string;
}

export function buildSystemHealthProbe(input: SystemHealthProbeInput): SystemHealthProbe {
  const providerFallback = input.geminiConfigured
    ? 'gemini_configured'
    : input.openaiConfigured
      ? 'openai_configured'
      : input.metaConfigured
        ? 'meta_configured'
        : 'none';

  const live = Boolean(input.supabaseUrl.trim() && input.supabaseApiKey.trim());

  return {
    connector: 'supabase',
    status: live ? 'REAL_LIVE' : 'UNCONFIGURED',
    providerFallback,
    evidence: live
      ? 'REAL_LIVE: Supabase connector is configured for a live read path.'
      : 'UNCONFIGURED: Supabase connector credentials are not configured for a live read path.',
  };
}

export function isSystemHealthCommand(prompt: string): boolean {
  return /^(system_health|system health)$/i.test(prompt.trim());
}
