import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("reloads operational history when the authorized organization context becomes available", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /if \(authenticated\) void loadOperationalHistory\(\);[\s\S]*?\}, \[authenticated, organizationId\]\);/,
    "operational history loading must react to organizationId becoming available after auth",
  );
});
