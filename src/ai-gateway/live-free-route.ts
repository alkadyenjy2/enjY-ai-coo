import { FREE_AI_REGISTRY } from '../data/free-ai-registry';
import { selectRoutes } from './free-first-router';
import type { RouteCandidate } from './router-types';

type ProviderEnv = Record<string, string | undefined>;

const PROVIDER_KEYS: Record<string, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  'gemini-api': 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  huggingface: 'HF_TOKEN',
};

export type LiveFreeRouteResult =
  | { status: 'READY'; route: RouteCandidate; candidates: RouteCandidate[]; reason: string }
  | { status: 'BLOCKED'; route?: undefined; candidates: RouteCandidate[]; reason: string };

export function resolveLiveFreeRoute(env: ProviderEnv = process.env): LiveFreeRouteResult {
  const candidates = selectRoutes(FREE_AI_REGISTRY, {
    allowPaid: false,
    requireApi: true,
    capabilities: ['chat'],
  });

  const configured = candidates.find((candidate) => {
    const envKey = PROVIDER_KEYS[candidate.toolId];
    return Boolean(envKey && env[envKey]);
  });

  if (!configured) {
    return {
      status: 'BLOCKED',
      candidates,
      reason: 'No configured verified free AI route is available. No paid route is selected automatically.',
    };
  }

  return {
    status: 'READY',
    route: configured,
    candidates,
    reason: `Selected configured verified free route: ${configured.name}.`,
  };
}

export function providerEnvKey(toolId: string): string | undefined {
  return PROVIDER_KEYS[toolId];
}
