export interface SystemHealthProbeInput {
  supabaseUrl: string;
  supabaseApiKey: string;
  openaiConfigured: boolean;
  geminiConfigured: boolean;
  metaConfigured: boolean;
}

export interface SystemHealthProbe {
  connector: 'supabase';
  status: 'CONFIGURED' | 'UNCONFIGURED';
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
    status: live ? 'CONFIGURED' : 'UNCONFIGURED',
    providerFallback,
    evidence: live
      ? 'CONFIGURED: Supabase credentials are present; a live read has not been verified yet.'
      : 'UNCONFIGURED: Supabase connector credentials are not configured for a live read path.',
  };
}

export function shouldUseDeterministicSystemHealth(commandClass: string): boolean {
  return commandClass === "SYSTEM_HEALTH";
}

export function isSystemHealthCommand(prompt: string): boolean {
  return /^(system_health|system health)$/i.test(prompt.trim());
}
