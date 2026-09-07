import { BrowserUse } from 'browser-use-sdk/v4';

export interface BrowserUseRunResult {
  sessionId: string;
  status: string;
  task?: string;
  output?: unknown;
  evidence?: Array<Record<string, unknown>>;
}

export interface BrowserUseClient {
  run(task: string): Promise<BrowserUseRunResult>;
}

export interface BrowserUseExecutionInput {
  task: string;
}

export interface BrowserUseExecutionResult {
  sessionId: string;
  status: string;
  output?: unknown;
  evidence?: Array<Record<string, unknown>>;
}

/** Thin provider boundary for Browser Use. Provider-specific SDK details stay outside the AI CORE COO execution contract. */
export class BrowserUseAdapter {
  constructor(private readonly client: BrowserUseClient) {}

  async execute(input: BrowserUseExecutionInput): Promise<BrowserUseExecutionResult> {
    if (!input.task.trim()) {
      throw new Error('Browser Use task is required');
    }

    const result = await this.client.run(input.task);

    return {
      sessionId: result.sessionId,
      status: result.status,
      output: result.output,
      evidence: result.evidence,
    };
  }
}

/** Creates the real Browser Use Cloud v4 client behind the adapter boundary. */
export function createBrowserUseCloudClient(): BrowserUseAdapter {
  if (!process.env.BROWSER_USE_API_KEY) {
    throw new Error('BROWSER_USE_API_KEY is required for Browser Use Cloud');
  }

  const client = new BrowserUse();

  return new BrowserUseAdapter({
    async run(task: string): Promise<BrowserUseRunResult> {
      const run = await client.runs.create({ task });
      const result = await client.runs.waitForCompletion(run.id);
      const sessionId = result.sessionId || run.sessionId || run.id;

      return {
        sessionId,
        status: result.status,
        output: result.result,
        evidence: [
          {
            type: 'browser-use-run',
            runId: run.id,
            sessionId,
          },
        ],
      };
    },
  });
}
