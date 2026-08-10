export interface UserRoleContext {
  userId: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  permissions: string[];
}

export interface CostControlReport {
  monthlyBudgetUSD: number;
  currentSpendUSD: number;
  apiCallCounts: Record<string, number>;
  rateLimiterStatus: 'OPTIMAL' | 'THROTTLED' | 'HALTED';
}

export class OperationsManager {
  private apiCallCounts: Record<string, number> = {
    gemini: 0,
    postiz: 0,
    whop: 0,
    outscraper: 0,
    tavily: 0,
    ghl: 0
  };
  private currentSpendUSD = 1.45;
  private monthlyBudgetUSD = 250.00;

  public verifyRolePermission(context: UserRoleContext, requiredPermission: string): boolean {
    if (context.role === 'ADMIN') return true;
    return context.permissions.includes(requiredPermission);
  }

  public logApiCall(service: string, estimatedCostUSD: number = 0.001) {
    this.apiCallCounts[service] = (this.apiCallCounts[service] || 0) + 1;
    this.currentSpendUSD += estimatedCostUSD;
  }

  public getCostControlReport(): CostControlReport {
    const isThrottled = this.currentSpendUSD > (this.monthlyBudgetUSD * 0.9);
    return {
      monthlyBudgetUSD: this.monthlyBudgetUSD,
      currentSpendUSD: Number(this.currentSpendUSD.toFixed(4)),
      apiCallCounts: { ...this.apiCallCounts },
      rateLimiterStatus: isThrottled ? 'THROTTLED' : 'OPTIMAL'
    };
  }

  public auditSecretsStatus(): Record<string, { present: boolean; status: string }> {
    return {
      GEMINI_API_KEY: { present: !!process.env.GEMINI_API_KEY, status: process.env.GEMINI_API_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' },
      POSTIZ_API_KEY: { present: !!process.env.POSTIZ_API_KEY, status: process.env.POSTIZ_API_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' },
      WHOP_API_KEY: { present: !!process.env.WHOP_API_KEY, status: process.env.WHOP_API_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' },
      OUTSCRAPER_API_KEY: { present: !!process.env.OUTSCRAPER_API_KEY, status: process.env.OUTSCRAPER_API_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' },
      GHL_API_KEY: { present: !!process.env.GHL_API_KEY, status: process.env.GHL_API_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' },
      TAVILY_API_KEY: { present: !!process.env.TAVILY_API_KEY, status: process.env.TAVILY_API_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' },
      STRIPE_SECRET_KEY: { present: !!process.env.STRIPE_SECRET_KEY, status: process.env.STRIPE_SECRET_KEY ? 'ACTIVE' : 'FALLBACK_SIMULATION' }
    };
  }
}

export const operationsManager = new OperationsManager();
