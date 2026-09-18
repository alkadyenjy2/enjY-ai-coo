import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "enjy-ai-coo",
});

export const runAgentCommand = inngest.createFunction(
  {
    id: "jarvis-agent-command",
    name: "JARVIS Agent Command",
    triggers: { event: "jarvis/agent.command" },
    retries: 0,
    idempotency: "event.data.executionId",
  },
  async ({ event, step, runId }) => {
    return step.run("execute-agent-command", async () => {
      const { executeAgentCommand } = await import("../../server");
      const body = event.data.request as Record<string, unknown>;
      const response = await executeAgentCommand(
        { body, inngestRunId: runId } as any,
        {
          json: (value: unknown) => value,
          status: (_status: number) => ({
            json: (value: unknown) => value,
          }),
        } as any,
      );
      return response;
    });
  },
);

export const functions = [runAgentCommand];
