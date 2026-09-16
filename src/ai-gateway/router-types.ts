import type { AIRegistryEntry, PricingStatus } from './registry-types';

export interface RouteRequest {
  capabilities: string[];
  allowPaid: boolean;
  requireApi?: boolean;
}

export interface RouteCandidate {
  toolId: string;
  name: string;
  pricingStatus: PricingStatus;
  verificationStatus: AIRegistryEntry['verificationStatus'];
  priority: number;
  fallbackToolIds: string[];
}
