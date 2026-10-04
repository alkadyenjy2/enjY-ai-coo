import test from "node:test";
import assert from "node:assert/strict";
import { buildOperationalHistoryUrl } from "../src/utils/operationalHistory";

test("builds operational history URL with authorized organization context", () => {
  assert.equal(
    buildOperationalHistoryUrl("5c3d0b58-f2dd-4677-be24-2bfc06da19cb", 50),
    "/api/agent/history?limit=50&organization_id=5c3d0b58-f2dd-4677-be24-2bfc06da19cb",
  );
});

test("rejects missing organization context", () => {
  assert.throws(() => buildOperationalHistoryUrl("", 50), /organization_id/i);
});
