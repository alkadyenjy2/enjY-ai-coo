export interface N8nHealthResult {
  status: 'REAL_LIVE' | 'UNCONFIGURED' | string;
  message: string;
  authPresent: boolean;
  actualCall: boolean;
  latencyMs?: number;
  evidence: string;
}

type Environment = Record<string, string | undefined>;
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** A configured URL/key pair is not evidence of a live n8n connection. Probe its authenticated API. */
export async function probeN8nHealth(
  env: Environment = process.env,
  fetcher: FetchLike = fetch,
): Promise<N8nHealthResult> {
  const rawUrl = (env.N8N_URL || '').trim();
  const apiKey = (env.N8N_API_KEY || '').trim();
  if (!rawUrl || !apiKey) {
    return {
      status: 'UNCONFIGURED',
      message: 'n8n API URL and API key are required for a live probe.',
      authPresent: false,
      actualCall: false,
      evidence: 'Missing N8N_URL or N8N_API_KEY.',
    };
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    return {
      status: 'UNCONFIGURED',
      message: 'n8n API URL must be a valid HTTPS URL.',
      authPresent: false,
      actualCall: false,
      evidence: 'N8N_URL is invalid.',
    };
  }
  if (baseUrl.protocol !== 'https:') {
    return {
      status: 'UNCONFIGURED',
      message: 'n8n API URL must use HTTPS.',
      authPresent: false,
      actualCall: false,
      evidence: 'N8N_URL is not HTTPS; credentials were not sent.',
    };
  }

  const endpoint = new URL('/api/v1/workflows?limit=1', baseUrl);
  const startedAt = Date.now();
  try {
    const response = await fetcher(endpoint, {
      method: 'GET',
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - startedAt;
    if (response.ok) {
      return {
        status: 'REAL_LIVE',
        message: 'Authenticated n8n API probe succeeded.',
        authPresent: true,
        actualCall: true,
        latencyMs,
        evidence: 'Authenticated n8n API returned HTTP ' + response.status + '.',
      };
    }
    return {
      status: 'UNHEALTHY_HTTP_' + response.status,
      message: 'n8n API probe failed; check API access and credentials.',
      authPresent: true,
      actualCall: true,
      latencyMs,
      evidence: 'Authenticated n8n API returned HTTP ' + response.status + '.',
    };
  } catch {
    return {
      status: 'UNHEALTHY',
      message: 'n8n API probe failed before a successful response.',
      authPresent: true,
      actualCall: true,
      latencyMs: Date.now() - startedAt,
      evidence: 'n8n API request failed or timed out; no success was recorded.',
    };
  }
}
