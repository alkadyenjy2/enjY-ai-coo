export type AccessType = 'API' | 'WEB' | 'LOCAL' | 'OSS' | 'API+WEB' | 'LOCAL+OSS';

export type PricingStatus =
  | 'VERIFIED_FREE'
  | 'FREE_TIER'
  | 'FREE_WEB_ONLY'
  | 'LOCAL_FREE'
  | 'OSS_FREE'
  | 'PAID_ONLY'
  | 'UNVERIFIED';

export type AutomationLevel = 'FULL_API' | 'PARTIAL_API' | 'BROWSER_REQUIRED' | 'MANUAL_ONLY';
export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'DEGRADED' | 'DISABLED';

export interface AIRegistryEntry {
  toolId: string;
  name: string;
  category: string;
  accessType: AccessType;
  capabilities: string[];
  pricingStatus: PricingStatus;
  requiresAccount: boolean;
  requiresCard: boolean;
  automationLevel: AutomationLevel;
  priority: number;
  enabled: boolean;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  verificationSource: string;
  fallbackToolIds: string[];
  notes?: string;
}
