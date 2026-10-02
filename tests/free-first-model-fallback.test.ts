import test from "node:test";
import assert from "node:assert/strict";
import { resolveJarvisModel } from "../src/ai-gateway/model-fallback";

test("defaults to the free Gemini model when no model is requested", () => {
  assert.equal(resolveJarvisModel(undefined, false), "gemini-3.6-flash");
});

test("reroutes the paid OpenAI model to Gemini by default", () => {
  assert.equal(resolveJarvisModel("gpt-6-astra", false), "gemini-3.6-flash");
});

test("reroutes the Meta model to Gemini by default", () => {
  assert.equal(resolveJarvisModel("muse-spark-1.3", false), "gemini-3.6-flash");
});

test("allows an explicitly enabled paid model", () => {
  assert.equal(resolveJarvisModel("gpt-6-astra", true), "gpt-6-astra");
});
