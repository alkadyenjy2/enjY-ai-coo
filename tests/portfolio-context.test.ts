import test from "node:test";
import assert from "node:assert/strict";
import { getPortfolioContext } from "../src/core/portfolio-context";

test("JARVIS system context includes every canonical portfolio project", () => {
  const context = getPortfolioContext();
  for (const project of [
    "JARVIS / ENJY AI COO",
    "Side Hustle Hub / IdeaCollector",
    "RIZKAHA / FLOURISH",
    "ZA Media AI Growth Engine",
    "ZE Outsource",
    "Short Drama World",
    "Scholarship OS",
    "NileCare",
    "Roofing AI Operations",
  ]) {
    assert.ok(context.includes(project), `missing project context: ${project}`);
  }
});

test("JARVIS system context preserves canonical backend and outbound safety boundaries", () => {
  const context = getPortfolioContext();
  assert.match(context, /ZA Media[\s\S]*Convex ONLY/i);
  assert.match(context, /RIZKAHA[\s\S]*Firebase\/Firestore/i);
  assert.match(context, /NileCare[\s\S]*Neon/i);
  assert.match(context, /PRODUCTION_OUTBOUND_FROZEN = true/);
  assert.match(context, /no source means do not publish/i);
  assert.match(context, /Roofing[\s\S]*separate from ZE Outsource/i);
});
