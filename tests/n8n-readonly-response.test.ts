import test from "node:test";
import assert from "node:assert/strict";
import { parseReadOnlyStatusResult } from "../src/utils/n8nReadOnlyResponse";

const response = (status: string, content = "Portfolio status evidence") => ({
  content,
  executionRecord: { tool: "n8n Model-Free Status", results: { status } },
});

test("renders a persisted read-only portfolio result", () => {
  assert.deepEqual(parseReadOnlyStatusResult(response("READ_ONLY_COMPLETED", "JARVIS: PARTIAL")), {
    content: "JARVIS: PARTIAL\n\nStatus: READ_ONLY_COMPLETED",
    status: "READ_ONLY_COMPLETED",
  });
});

test("renders a blocked read-only result without claiming success", () => {
  assert.deepEqual(parseReadOnlyStatusResult(response("READ_ONLY_BLOCKED", "Evidence gate blocked completion.")), {
    content: "Evidence gate blocked completion.\n\nStatus: READ_ONLY_BLOCKED",
    status: "READ_ONLY_BLOCKED",
  });
});

test("rejects unrelated, malformed, or unverified response shapes", () => {
  assert.equal(parseReadOnlyStatusResult({ ...response("READ_ONLY_COMPLETED"), executionRecord: { tool: "other", results: { status: "READ_ONLY_COMPLETED" } } }), null);
  assert.equal(parseReadOnlyStatusResult(response("COMPLETED")), null);
  assert.equal(parseReadOnlyStatusResult(response("READ_ONLY_COMPLETED", "   ")), null);
  assert.equal(parseReadOnlyStatusResult({ content: "text", executionRecord: { tool: "n8n Model-Free Status", results: null } }), null);
  assert.equal(parseReadOnlyStatusResult(null), null);
});
