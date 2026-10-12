import { selectRoutes } from './free-first-router';
import { FREE_AI_REGISTRY } from '../data/free-ai-registry';

export interface LiveModelRoute {
  providerId: 'openrouter' | 'gemini-api' | 'groq';
  model: string;
  apiKey: string;
  baseUrl: string | null;
}

type Environment = Record<string, string | undefined>;

const ADAPTERS = {
  openrouter: {
    envKey: 'OPENROUTER_API_KEY',
    modelEnvKey: 'JARVIS_OPENROUTER_MODEL',
    defaultModel: 'openrouter/free',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  'gemini-api': {
    envKey: 'GEMINI_API_KEY',
    modelEnvKey: 'JARVIS_GEMINI_MODEL',
    defaultModel: 'gemini-3.6-flash',
    baseUrl: null,
  },
  groq: {
    envKey: 'GROQ_API_KEY',
    modelEnvKey: 'JARVIS_GROQ_MODEL',
    defaultModel: 'openai/gpt-oss-120b',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
} as const;

/**
 * Selects only free-first registry candidates that have both a supported
 * adapter and a non-blank credential. Registry metadata alone never enables
 * a live provider call.
 */
export function resolveLiveModelRoute(env: Environment = process.env): LiveModelRoute | null {
  const candidates = selectRoutes(FREE_AI_REGISTRY, {
    capabilities: ['chat'],
    allowPaid: false,
    requireApi: true,
  });

  for (const candidate of candidates) {
    if (candidate.toolId !== 'openrouter' && candidate.toolId !== 'gemini-api' && candidate.toolId !== 'groq') continue;
    // Groq model usage is metered; require an explicit production cost gate before selecting it.
    if (candidate.toolId === 'groq' && env.JARVIS_ALLOW_GROQ_BILLABLE !== 'true') continue;
    const adapter = ADAPTERS[candidate.toolId];
    const apiKey = (env[adapter.envKey] || '').trim();
    if (!apiKey) continue;

    return {
      providerId: candidate.toolId,
      model: (env[adapter.modelEnvKey] || '').trim() || adapter.defaultModel,
      apiKey,
      baseUrl: adapter.baseUrl,
    };
  }

  return null;
}

/**
 * Readiness must reflect the provider the command path can actually select,
 * not merely the presence of any provider key. The default command model is
 * paid OpenAI only when the explicit paid-model gate is enabled; otherwise
 * only an integrated, credentialed free-first route counts as ready.
 */
export function isLiveModelRouteConfigured(env: Environment = process.env): boolean {
  if (env.JARVIS_ALLOW_PAID_MODEL === 'true') {
    return Boolean((env.OPENAI_API_KEY || '').trim());
  }
  return resolveLiveModelRoute(env) !== null;
}
