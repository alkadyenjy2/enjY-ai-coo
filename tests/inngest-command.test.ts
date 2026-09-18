import test from "node:test";
import assert from "node:assert/strict";
import { runAgentCommand } from "../src/inngest";

test("Inngest command function is configured for durable execution", () => {
  assert.ok(runAgentCommand);
  assert.equal(typeof runAgentCommand.id, "function");
  assert.equal(runAgentCommand.id(), "jarvis-agent-command");
});
