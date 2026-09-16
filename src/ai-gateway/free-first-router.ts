import type { AIRegistryEntry } from './registry-types';
import type { RouteCandidate, RouteRequest } from './router-types';

const FREE_STATUSES = new Set([
  'VERIFIED_FREE',
  'FREE_TIER',
  'FREE_WEB_ONLY',
  'LOCAL_FREE',
  'OSS_FREE',
]);

function capabilityMatch(entry: AIRegistryEntry, requested: string[]): boolean {
  return requested.every((capability) => entry.capabilities.includes(capability));
}

function eligible(entry: AIRegistryEntry, request: RouteRequest): boolean {
  if (!entry.enabled || entry.verificationStatus !== 'VERIFIED') return false;
  if (!request.allowPaid && !FREE_STATUSES.has(entry.pricingStatus)) return false;
  if (request.requireApi && !entry.accessType.includes('API')) return false;
  return capabilityMatch(entry, request.capabilities);
}

function pricingRank(status: AIRegistryEntry['pricingStatus']): number {
  switch (status) {
    case 'VERIFIED_FREE':
    case 'LOCAL_FREE':
    case 'OSS_FREE':
      return 0;
    case 'FREE_TIER':
      return 1;
    case 'FREE_WEB_ONLY':
      return 2;
    case 'PAID_ONLY':
      return 3;
    case 'UNVERIFIED':
      return 4;
    default:
      return 5;
  }
}

export function selectRoutes(
  registry: AIRegistryEntry[],
  request: RouteRequest,
): RouteCandidate[] {
  return registry
    .filter((entry) => eligible(entry, request))
    .sort((a, b) => {
      const price = pricingRank(a.pricingStatus) - pricingRank(b.pricingStatus);
      if (price !== 0) return price;
      return b.priority - a.priority;
    })
    .map((entry) => ({
      toolId: entry.toolId,
      name: entry.name,
      pricingStatus: entry.pricingStatus,
      verificationStatus: entry.verificationStatus,
      priority: entry.priority,
      fallbackToolIds: entry.fallbackToolIds,
    }));
}
