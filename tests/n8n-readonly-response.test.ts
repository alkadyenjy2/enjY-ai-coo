import test from "node:test";
import assert from "node:assert/strict";
import { parseReadOnlyN8nResponse } from "../src/utils/n8nReadOnlyResponse";

test("renders a successful read-only response with its result and status", () => {
  assert.deepEqual(parseReadOnlyN8nResponse(200, {
    status: "READ_ONLY_COMPLETED",
    approvalRequired: false,
    result: "JARVIS: PARTIAL",
  }), {
    content: "JARVIS: PARTIAL\n\nStatus: READ_ONLY_COMPLETED",
    status: "READ_ONLY_COMPLETED",
  });
});

test("renders an explicitly blocked read-only response without claiming success", () => {
  assert.deepEqual(parseReadOnlyN8nResponse(200, {
    status: "READ_ONLY_BLOCKED",
    approvalRequired: false,
    message: "Evidence gate blocked completion.",
  }), {
    content: "Evidence gate blocked completion.\n\nStatus: READ_ONLY_BLOCKED",
    status: "READ_ONLY_BLOCKED",
  });
});

test("rejects responses that are not HTTP 200 read-only outcomes", () => {
  assert.equal(parseReadOnlyN8nResponse(202, {
    status: "READ_ONLY_COMPLETED", approvalRequired: false, result: "fake",
  }), null);
  assert.equal(parseReadOnlyN8nResponse(200, {
    status: "WAITING_FOR_APPROVAL", approvalRequired: false, result: "fake",
  }), null);
  assert.equal(parseReadOnlyN8nResponse(200, {
    status: "READ_ONLY_COMPLETED", approvalRequired: true, result: "fake",
  }), null);
  assert.equal(parseReadOnlyN8nResponse(200, {
    status: "READ_ONLY_COMPLETED", approvalRequired: false, result: "",
  }), null);
  assert.equal(parseReadOnlyN8nResponse(200, null), null);
});
