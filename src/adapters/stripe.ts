import { createHmac, timingSafeEqual } from 'node:crypto';

function safeEqualHex(expected: string, received: string): boolean {
  if (!/^[a-f0-9]+$/i.test(received) || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
}

export interface StripeCheckoutInput {
  productName: string;
  priceUSD: number;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutResult {
  sessionId: string;
  checkoutUrl: string;
  paymentStatus: 'UNPAID' | 'PAID';
  amountTotal: number;
  isRealApiCall: boolean;
}

export class StripeAdapter {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY;
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public async createCheckoutSession(input: StripeCheckoutInput): Promise<StripeCheckoutResult> {
    if (!this.apiKey) {
      // Structured simulation when STRIPE_SECRET_KEY is absent
      const sessionId = `cs_sim_${Date.now()}`;
      return {
        sessionId,
        checkoutUrl: `https://checkout.stripe.com/pay/${sessionId}`,
        paymentStatus: 'UNPAID',
        amountTotal: input.priceUSD,
        isRealApiCall: false
      };
    }

    try {
      const body = new URLSearchParams();
      body.append('payment_method_types[]', 'card');
      body.append('line_items[0][price_data][currency]', 'usd');
      body.append('line_items[0][price_data][product_data][name]', input.productName);
      body.append('line_items[0][price_data][unit_amount]', Math.round(input.priceUSD * 100).toString());
      body.append('line_items[0][quantity]', '1');
      body.append('mode', 'payment');
      body.append('success_url', 'https://aicore.app/success?session_id={CHECKOUT_SESSION_ID}');
      body.append('cancel_url', 'https://aicore.app/cancel');
      if (input.customerEmail) {
        body.append('customer_email', input.customerEmail);
      }

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Stripe API error ${response.status}: ${errText}`);
      }

      const data: any = await response.json();
      return {
        sessionId: data.id,
        checkoutUrl: data.url,
        paymentStatus: data.payment_status === 'paid' ? 'PAID' : 'UNPAID',
        amountTotal: input.priceUSD,
        isRealApiCall: true
      };
    } catch (err: any) {
      return {
        sessionId: `cs_err_${Date.now()}`,
        checkoutUrl: '',
        paymentStatus: 'UNPAID',
        amountTotal: input.priceUSD,
        isRealApiCall: true
      };
    }
  }

  public verifyAndProcessWebhook(rawBody: string, sig: string): { valid: boolean; eventType: string; payload: any } {
    const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    if (!endpointSecret || typeof rawBody !== 'string' || !sig) {
      return { valid: false, eventType: 'unknown', payload: null };
    }

    const signatureParts = sig.split(',').map((part) => part.trim());
    const timestampValue = signatureParts.find((part) => part.startsWith('t='))?.slice(2) || '';
    const timestamp = Number(timestampValue);
    const signatures = signatureParts
      .filter((part) => part.startsWith('v1='))
      .map((part) => part.slice(3));

    if (!Number.isInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300 || signatures.length === 0) {
      return { valid: false, eventType: 'unknown', payload: null };
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', endpointSecret).update(signedPayload, 'utf8').digest('hex');
    const valid = signatures.some((candidate) => safeEqualHex(expectedSignature, candidate));
    if (!valid) return { valid: false, eventType: 'unknown', payload: null };

    try {
      const parsed = JSON.parse(rawBody);
      return {
        valid: true,
        eventType: parsed.type || 'checkout.session.completed',
        payload: parsed.data?.object || parsed
      };
    } catch {
      return { valid: false, eventType: 'unknown', payload: null };
    }
  }
}

export const stripeAdapter = new StripeAdapter();
