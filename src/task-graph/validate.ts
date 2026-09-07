import type { Plan, TaskNode } from "./types";

export function validateTaskGraph(plan: Plan): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const node of plan.nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate task id: ${node.id}`);
    ids.add(node.id);
    if (node.maxAttempts < 1) errors.push(`Invalid maxAttempts for ${node.id}`);
    if (node.state === "SUCCEEDED" && !node.verificationStatus) {
      errors.push(`Succeeded task ${node.id} is missing verification status`);
    }
  }

  for (const node of plan.nodes) {
    for (const dependency of node.dependencies) {
      if (!ids.has(dependency)) errors.push(`Missing dependency ${dependency} for ${node.id}`);
      if (dependency === node.id) errors.push(`Self dependency on ${node.id}`);
    }
  }

  const byId = new Map(plan.nodes.map((node) => [node.id, node]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: TaskNode) => {
    if (visiting.has(node.id)) {
      errors.push(`Cycle detected at ${node.id}`);
      return;
    }
    if (visited.has(node.id)) return;
    visiting.add(node.id);
    for (const dep of node.dependencies) {
      const dependency = byId.get(dep);
      if (dependency) visit(dependency);
    }
    visiting.delete(node.id);
    visited.add(node.id);
  };
  for (const node of plan.nodes) visit(node);

  return [...new Set(errors)];
}

export function assertValidTaskGraph(plan: Plan): void {
  const errors = validateTaskGraph(plan);
  if (errors.length) throw new Error(`INVALID_TASK_GRAPH: ${errors.join("; ")}`);
}
