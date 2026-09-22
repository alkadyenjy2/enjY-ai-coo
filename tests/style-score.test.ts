import test from "node:test";
import assert from "node:assert/strict";
import { styleScore, styleResponse } from "../src/ai-gateway/style";

test("style score detects the target Egyptian feminine signal", () => {
  const text = "بصي يا قمر، ده للهيشان مش التساقط، جربي الـ Leave-in لو تحبي";
  const score = styleScore(text);
  assert.equal(score.withinTarget, true);
  assert.equal(score.feminineEgyptianSignal, true);
});

test("style response adds one CTA and keeps the target length when possible", () => {
  const text = "بصي يا قمر، ده للهيشان مش التساقط، جربي الـ Leave-in";
  const result = styleResponse(text, { cta: "تحبي أجربهولك؟" });
  assert.ok(result.split(/\s+/u).length <= 12);
  assert.ok(result.includes("تحبي أجربهولك؟"));
});
