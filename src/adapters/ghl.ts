import { LeadRecord } from './outscraper';

export interface GHLDeliveryResult {
  contactId: string;
  businessName: string;
  pipelineStage: string;
  status: 'DELIVERED' | 'FAILED';
  ghlLocationId: string;
  isRealApiCall: boolean;
  error?: string;
}

export class GHLAdapter {
  private apiKey: string | undefined;
  private locationId: string;

  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.locationId = process.env.GHL_LOCATION_ID || 'ghl-loc-roofing-default';
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public async deliverLeadToGHL(lead: LeadRecord): Promise<GHLDeliveryResult> {
    if (!this.apiKey) {
      // Structured fallback simulation
      return {
        contactId: `ghl-cnt-${Date.now()}`,
        businessName: lead.businessName,
        pipelineStage: 'Qualified Lead - Ready for Outreach',
        status: 'DELIVERED',
        ghlLocationId: this.locationId,
        isRealApiCall: false
      };
    }

    try {
      const response = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: lead.ownerName,
          companyName: lead.businessName,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          customField: {
            qualification_score: lead.qualificationScore,
            qualification_reason: lead.qualificationReason
          },
          tags: ['AI_QUALIFIED_ROOFING_LEAD', 'AUTOMATED_PIPELINE']
        })
      });

      if (!response.ok) {
        throw new Error(`GHL API error ${response.status}`);
      }

      const data: any = await response.json();
      return {
        contactId: data.contact?.id || `ghl-${Date.now()}`,
        businessName: lead.businessName,
        pipelineStage: 'Qualified Lead',
        status: 'DELIVERED',
        ghlLocationId: this.locationId,
        isRealApiCall: true
      };
    } catch (err: any) {
      return {
        contactId: `ghl-err-${Date.now()}`,
        businessName: lead.businessName,
        pipelineStage: 'Delivery Failed',
        status: 'FAILED',
        ghlLocationId: this.locationId,
        error: err.message,
        isRealApiCall: true
      };
    }
  }
}

export const ghlAdapter = new GHLAdapter();
