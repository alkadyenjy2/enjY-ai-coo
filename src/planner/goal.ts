import type { Goal } from "../task-graph/types";

export function normalizeGoal(text: string, context: Record<string, unknown> = {}): Goal {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error("GOAL_REQUIRED");
  const stableSource = JSON.stringify({ text: normalized, context });
  let hash = 2166136261;
  for (let i = 0; i < stableSource.length; i += 1) {
    hash ^= stableSource.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return { id: `goal-${(hash >>> 0).toString(16)}`, text: normalized, context };
}
