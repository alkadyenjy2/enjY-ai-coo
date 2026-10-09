import test from "node:test";
import assert from "node:assert/strict";
import { isPersonalModeEnabled } from "../src/auth/server.ts";

const original = process.env.JARVIS_PERSONAL_MODE;

test.after(() => {
  if (original === undefined) delete process.env.JARVIS_PERSONAL_MODE;
  else process.env.JARVIS_PERSONAL_MODE = original;
});

test("personal mode is disabled by default", () => {
  delete process.env.JARVIS_PERSONAL_MODE;
  assert.equal(isPersonalModeEnabled(), false);
});

test("personal mode is enabled only by an explicit true setting", () => {
  process.env.JARVIS_PERSONAL_MODE = "true";
  assert.equal(isPersonalModeEnabled(), true);
  process.env.JARVIS_PERSONAL_MODE = "false";
  assert.equal(isPersonalModeEnabled(), false);
  process.env.JARVIS_PERSONAL_MODE = "1";
  assert.equal(isPersonalModeEnabled(), false);
});
