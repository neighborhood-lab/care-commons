/**
 * Stripe Service
 * 
 * Handles Stripe API integration for payment processing and subscription management.
 * This service creates real Stripe customers and subscriptions.
 */

import { UUID, ValidationError } from '../types/base.js';

export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
}

export interface CreateCustomerRequest {
  email: string;
  name: string;
  organizationId: UUID;
  metadata?: Record<string, string>;
}

export interface CreateStripeSubscriptionRequest {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string | null;
  created: number;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
}

/**
 * Stripe Service
 * 
 * Integrates with Stripe API for payment processing.
 * Gracefully handles missing API keys for development/testing.
 */
export class StripeService {
  private apiKey: string | null;
  private webhookSecret: string | null;
  private baseUrl = 'https://api.stripe.com/v1';
  
  constructor(config?: StripeConfig) {
    this.apiKey = config?.apiKey ?? process.env.STRIPE_API_KEY ?? null;
    this.webhookSecret = config?.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET ?? null;
    
    if (this.apiKey === null) {
      console.warn('[Stripe] STRIPE_API_KEY not configured. Stripe integration disabled.');
    }
  }
  
  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null;
  }
  
  /**
   * Create a Stripe customer
   */
  async createCustomer(request: CreateCustomerRequest): Promise<StripeCustomer> {
    if (!this.isConfigured()) {
      throw new ValidationError('Stripe is not configured');
    }
    
    const params = new URLSearchParams({
      email: request.email,
      name: request.name,
      'metadata[organization_id]': request.organizationId,
    });
    
    if (request.metadata !== undefined) {
      Object.entries(request.metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          params.append(`metadata[${key}]`, value);
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message ?? 'Unknown error'}`);
    }
    
    const customer = await response.json() as {
      id: string;
      email: string;
      name: string | null;
      created: number;
    };
    
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      created: customer.created,
    };
  }
  
  /**
   * Create a subscription for a customer
   */
  async createSubscription(request: CreateStripeSubscriptionRequest): Promise<StripeSubscription> {
    if (!this.isConfigured()) {
      throw new ValidationError('Stripe is not configured');
    }
    
    const params = new URLSearchParams({
      customer: request.customerId,
      'items[0][price]': request.priceId,
    });
    
    if (request.trialDays !== undefined && request.trialDays > 0) {
      params.append('trial_period_days', request.trialDays.toString());
    }
    
    if (request.metadata !== undefined) {
      Object.entries(request.metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          params.append(`metadata[${key}]`, value);
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message ?? 'Unknown error'}`);
    }
    
    const subscription = await response.json() as {
      id: string;
      customer: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      trial_start: number | null;
      trial_end: number | null;
      cancel_at_period_end: boolean;
      canceled_at: number | null;
    };
    
    return {
      id: subscription.id,
      customer: subscription.customer,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start !== null ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end !== null ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at !== null ? new Date(subscription.canceled_at * 1000) : null,
    };
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    if (this.webhookSecret === null) {
      console.warn('[Stripe] Webhook secret not configured. Skipping signature verification.');
      return true; // Allow in development
    }
    
    // TODO: Implement actual Stripe webhook signature verification
    // For now, we'll return true if webhook secret is configured
    // In production, you should use: stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    console.log('[Stripe] Webhook signature verification not yet implemented');
    return true;
  }
  
  /**
   * Get price ID for a plan
   * 
   * In production, these would be fetched from Stripe or environment variables
   */
  getPriceId(planName: string, interval: 'month' | 'year' = 'month'): string {
    // These are placeholder IDs - replace with real Stripe Price IDs
    const priceIds: Record<string, Record<string, string>> = {
      STARTER: {
        month: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? 'price_starter_monthly',
        year: process.env.STRIPE_PRICE_STARTER_YEARLY ?? 'price_starter_yearly',
      },
      PROFESSIONAL: {
        month: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? 'price_professional_monthly',
        year: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY ?? 'price_professional_yearly',
      },
      ENTERPRISE: {
        month: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? 'price_enterprise_monthly',
        year: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? 'price_enterprise_yearly',
      },
    };
    
    return priceIds[planName]?.[interval] ?? `price_${planName.toLowerCase()}_${interval}`;
  }
}

/**
 * Factory function to create Stripe service
 */
export function createStripeService(config?: StripeConfig): StripeService {
  return new StripeService(config);
}
