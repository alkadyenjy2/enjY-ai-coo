import { FREE_AI_REGISTRY } from '../data/free-ai-registry';
import { selectRoutes } from '../ai-gateway/free-first-router';

export interface JarvisRouteSummary {
  policy: 'FREE FIRST';
  primary: string;
  fallbacks: string[];
  status: 'READY' | 'BLOCKED';
}

export function summarizeJarvisRoute(_task: string): JarvisRouteSummary {
  const routes = selectRoutes(FREE_AI_REGISTRY, {
    capabilities: ['chat'],
    allowPaid: false,
    requireApi: true,
  });

  if (routes.length === 0) {
    return { policy: 'FREE FIRST', primary: 'No verified free route', fallbacks: [], status: 'BLOCKED' };
  }

  return {
    policy: 'FREE FIRST',
    primary: routes[0].name,
    fallbacks: routes.slice(1).map((route) => route.name),
    status: 'READY',
  };
}
