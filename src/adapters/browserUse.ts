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

/**
 * Thin provider boundary for Browser Use. Provider-specific SDK details stay
 * outside the AI CORE COO execution contract.
 */
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
