/// <reference types="vite/client" />

export interface EnvVarStatus {
  key: string;
  status: 'PRESENT' | 'ABSENT';
}

export interface EnvValidationSummary {
  timestamp: string;
  total: number;
  presentCount: number;
  absentCount: number;
  results: EnvVarStatus[];
}

export const REQUIRED_ENV_KEYS = [
  'GEMINI_API_KEY',
  'POSTIZ_API_KEY',
  'WHOP_API_KEY',
  'OUTSCRAPER_API_KEY',
  'GHL_API_KEY',
  'GHL_LOCATION_ID',
  'TAVILY_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

/**
 * Utility function that iterates through the list of required environment variables
 * and returns their status (PRESENT or ABSENT).
 */
export async function checkEnvStatus(): Promise<EnvValidationSummary> {
  try {
    const response = await fetch('/api/env-status');
    if (response.ok) {
      const data = await response.json();
      const results: EnvVarStatus[] = Object.entries(data.variables || {}).map(([key, status]) => ({
        key,
        status: status as 'PRESENT' | 'ABSENT'
      }));

      return {
        timestamp: data.timestamp || new Date().toISOString(),
        total: data.total || results.length,
        presentCount: data.presentCount ?? results.filter(r => r.status === 'PRESENT').length,
        absentCount: data.absentCount ?? results.filter(r => r.status === 'ABSENT').length,
        results
      };
    }
  } catch (err) {
    console.warn('Failed to fetch /api/env-status from server:', err);
  }

  // Fallback environment check
  const results: EnvVarStatus[] = REQUIRED_ENV_KEYS.map((key) => {
    const metaEnv = (import.meta as any).env || {};
    const val = metaEnv[key] || (typeof process !== 'undefined' ? process.env?.[key] : undefined);
    const isPresent = Boolean(val && String(val).trim().length > 0);
    return {
      key,
      status: isPresent ? 'PRESENT' : 'ABSENT'
    };
  });

  return {
    timestamp: new Date().toISOString(),
    total: REQUIRED_ENV_KEYS.length,
    presentCount: results.filter(r => r.status === 'PRESENT').length,
    absentCount: results.filter(r => r.status === 'ABSENT').length,
    results
  };
}
