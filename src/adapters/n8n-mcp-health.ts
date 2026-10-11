export type N8nMcpHealthStatus = 'UNCONFIGURED' | 'BROKEN' | 'REAL_LIVE';

export interface N8nMcpHealthResult {
  status: N8nMcpHealthStatus;
  connectorId: 'n8n';
  message: string;
  evidence: string;
  authPresent: boolean;
  actualCall: boolean;
  latencyMs: number;
  httpStatus?: number;
}

export interface N8nMcpHealthOptions {
  url?: string | null;
  apiKey?: string | null;
  timeoutMs?: number;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const CLIENT_INFO = {
  name: 'jarvis-ai-coo-health-probe',
  version: '1.0.0',
};

function result(
  status: N8nMcpHealthStatus,
  fields: Omit<N8nMcpHealthResult, 'status' | 'connectorId'>,
): N8nMcpHealthResult {
  return { status, connectorId: 'n8n', ...fields };
}

function extractJsonRpcResult(body: string, contentType: string): Record<string, unknown> | null {
  const candidates: string[] = [];

  if (contentType.toLowerCase().includes('text/event-stream')) {
    let dataLines: string[] = [];
    for (const line of body.split(/\r?\n/)) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      } else if (line === '' && dataLines.length > 0) {
        candidates.push(dataLines.join('\n'));
        dataLines = [];
      }
    }
    if (dataLines.length > 0) candidates.push(dataLines.join('\n'));
  } else {
    candidates.push(body);
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
      const rpc = parsed as Record<string, unknown>;
      if (rpc.jsonrpc !== '2.0' || rpc.id !== 1 || !rpc.result || typeof rpc.result !== 'object') continue;
      const payload = rpc.result as Record<string, unknown>;
      if (typeof payload.protocolVersion === 'string' || (payload.serverInfo && typeof payload.serverInfo === 'object')) {
        return payload;
      }
    } catch {
      // Ignore non-JSON SSE comments, event names, and malformed data frames.
    }
  }
  return null;
}

/**
 * Read-only n8n MCP initialize handshake. Does not invoke a workflow or model.
 * Credentials are server-side only and are never included in returned evidence.
 */
export async function probeN8nMcpHealth(
  options: N8nMcpHealthOptions,
  fetchImpl: FetchLike = fetch,
): Promise<N8nMcpHealthResult> {
  const urlValue = (options.url || '').trim();
  const apiKey = (options.apiKey || '').trim();

  if (!urlValue || !apiKey) {
    const missing = [!urlValue ? 'N8N_MCP_URL/N8N_URL' : '', !apiKey ? 'N8N_MCP_API_KEY/N8N_API_KEY' : '']
      .filter(Boolean)
      .join(' and ');
    return result('UNCONFIGURED', {
      message: 'n8n MCP credentials are not configured.',
      evidence: `Missing ${missing} environment variable(s); no network request was made.`,
      authPresent: false,
      actualCall: false,
      latencyMs: 0,
    });
  }

  let endpoint: URL;
  try {
    endpoint = new URL(urlValue);
  } catch {
    return result('BROKEN', {
      message: 'n8n MCP endpoint URL is invalid.',
      evidence: 'N8N_MCP_URL/N8N_URL is not a valid absolute URL; no network request was made.',
      authPresent: true,
      actualCall: false,
      latencyMs: 0,
    });
  }

  if (endpoint.protocol !== 'https:') {
    return result('BROKEN', {
      message: 'n8n MCP requires an HTTPS endpoint.',
      evidence: 'Endpoint must use HTTPS so the bearer credential is not sent over plaintext HTTP; no network request was made.',
      authPresent: true,
      actualCall: false,
      latencyMs: 0,
    });
  }

  const startedAt = Date.now();
  const timeoutMs = Number.isFinite(options.timeoutMs) && (options.timeoutMs ?? 0) > 0
    ? Math.min(options.timeoutMs as number, 10_000)
    : 5_000;

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: CLIENT_INFO,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return result('BROKEN', {
        message: 'n8n MCP authentication or endpoint check failed.',
        evidence: `MCP initialize handshake returned HTTP ${response.status}; authentication and endpoint access are not verified.`,
        authPresent: true,
        actualCall: true,
        latencyMs,
        httpStatus: response.status,
      });
    }

    const body = await response.text();
    const initialized = extractJsonRpcResult(body, response.headers.get('content-type') || '');
    if (!initialized) {
      return result('BROKEN', {
        message: 'n8n MCP returned an invalid initialize response.',
        evidence: 'HTTP response was successful, but no valid JSON-RPC MCP initialize result was found.',
        authPresent: true,
        actualCall: true,
        latencyMs,
        httpStatus: response.status,
      });
    }

    const serverInfo = initialized.serverInfo as Record<string, unknown> | undefined;
    const serverName = typeof serverInfo?.name === 'string' ? serverInfo.name : 'n8n MCP server';
    return result('REAL_LIVE', {
      message: 'n8n MCP endpoint passed an authenticated initialize handshake.',
      evidence: `Authenticated MCP initialize handshake succeeded over HTTPS (${serverName}); no workflow or model was executed.`,
      authPresent: true,
      actualCall: true,
      latencyMs,
      httpStatus: response.status,
    });
  } catch {
    return result('BROKEN', {
      message: 'n8n MCP network request failed.',
      evidence: 'Network request failed during MCP initialize handshake (network, TLS, timeout, or transport error); no connection was verified.',
      authPresent: true,
      actualCall: true,
      latencyMs: Date.now() - startedAt,
    });
  }
}
