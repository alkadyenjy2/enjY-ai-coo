import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const serverSource = fs.readFileSync(new URL("../server.ts", import.meta.url), "utf8");

test("media command is queue-first and does not execute provider synchronously", () => {
  const mediaIndex = serverSource.indexOf('call.name === "execute_media"');
  const queryIndex = serverSource.indexOf('call.name === "query_supabase"', mediaIndex);
  assert.ok(mediaIndex > 0);
  assert.ok(queryIndex > mediaIndex);
  const mediaBlock = serverSource.slice(mediaIndex, queryIndex);
  assert.match(mediaBlock, /createDurableJob\(/);
  assert.match(mediaBlock, /enqueueDurableJob\(durableJob\.id\)/);
  assert.doesNotMatch(mediaBlock, /executeMediaJob\(/);
  assert.match(mediaBlock, /verificationStatus = "NOT_REQUIRED"/);
});

test("durable media worker rejects stale or invalid internal requests", () => {
  const workerIndex = serverSource.indexOf('app.post("/api/executions/worker"');
  assert.ok(workerIndex > 0);
  const workerBlock = serverSource.slice(workerIndex, serverSource.indexOf("// API Route: Agent Command Execution", workerIndex));
  assert.match(workerBlock, /x-jarvis-worker-timestamp/);
  assert.match(workerBlock, /x-jarvis-worker-signature/);
  assert.match(workerBlock, /timingSafeEqual/);
  assert.match(workerBlock, /Stale worker request/);
});
