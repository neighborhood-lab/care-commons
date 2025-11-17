/**
 * @care-commons/core - Billing Repository
 * 
 * Data access layer for subscription and billing operations
 * Uses raw SQL queries to interact with PostgreSQL database
 */

import { Database } from '../db/connection.js';
import { UUID, NotFoundError } from '../types/base.js';

// Subscription types (matches Stripe API)
export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export type PlanName = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

export interface Subscription {
  id: UUID;
  organizationId: UUID;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  planName: PlanName;
  billingInterval: 'month' | 'year';
  planAmount: number;
  currency: string;
  clientLimit: number;
  caregiverLimit: number;
  visitLimit: number | null;
  status: SubscriptionStatus;
  statusHistory: Array<{ status: SubscriptionStatus; timestamp: string; reason?: string }>;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  endedAt: Date | null;
  paymentMethodId: string | null;
  paymentMethodDetails: Record<string, unknown> | null;
  lastInvoiceDate: Date | null;
  lastInvoiceStatus: string | null;
  metadata: Record<string, unknown> | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
  version: number;
}

export interface BillingUsage {
  id: UUID;
  organizationId: UUID;
  subscriptionId: UUID;
  periodStart: Date;
  periodEnd: Date;
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  clientCount: number;
  caregiverCount: number;
  visitCount: number;
  userCount: number;
  peakClientCount: number;
  peakCaregiverCount: number;
  peakRecordedDate: Date | null;
  clientLimit: number;
  caregiverLimit: number;
  visitLimit: number | null;
  clientOverage: number;
  caregiverOverage: number;
  visitOverage: number;
  overageCharges: number;
  totalCharges: number;
  status: 'ACTIVE' | 'BILLED' | 'ARCHIVED';
  isBilled: boolean;
  billedDate: Date | null;
  dailySnapshots: Array<{ date: string; clientCount: number; caregiverCount: number; visitCount: number }>;
  notes: string | null;
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
  version: number;
}

export interface CreateSubscriptionRequest {
  organizationId: UUID;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planName: PlanName;
  billingInterval: 'month' | 'year';
  planAmount: number;
  clientLimit: number;
  caregiverLimit: number;
  visitLimit?: number;
  trialEnd?: Date;
  createdBy: UUID;
}

export interface IBillingRepository {
  // Subscription CRUD
  createSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
  getSubscriptionById(id: UUID): Promise<Subscription | null>;
  getSubscriptionByOrganization(organizationId: UUID): Promise<Subscription | null>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null>;
  updateSubscriptionStatus(id: UUID, status: SubscriptionStatus, updatedBy: UUID, reason?: string): Promise<void>;
  updateSubscriptionPeriod(id: UUID, periodStart: Date, periodEnd: Date, updatedBy: UUID): Promise<void>;
  cancelSubscription(id: UUID, canceledBy: UUID, reason?: string): Promise<void>;
  
  // Billing usage
  getCurrentUsage(organizationId: UUID): Promise<BillingUsage | null>;
  recordUsageSnapshot(organizationId: UUID, counts: { clients: number; caregivers: number; visits: number }, recordedBy: UUID): Promise<void>;
  
  // Utility methods
  checkTableExists(): Promise<boolean>;
}

export class BillingRepository implements IBillingRepository {
  constructor(private db: Database) {}

  async checkTableExists(): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions'
      ) as exists
    `;
    
    const result = await this.db.query<{ exists: boolean }>(query);
    return result.rows[0]?.exists ?? false;
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (request.billingInterval === 'year' ? 12 : 1));

    const query = `
      INSERT INTO subscriptions (
        organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        plan_name, billing_interval, plan_amount, currency,
        client_limit, caregiver_limit, visit_limit,
        status, status_history,
        current_period_start, current_period_end,
        trial_start, trial_end,
        cancel_at_period_end,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13,
        $14, $15,
        $16, $17,
        $18,
        $19, $20
      )
      RETURNING *
    `;

    const statusHistory = [
      {
        status: request.trialEnd ? 'trialing' : 'active',
        timestamp: now.toISOString(),
        reason: 'Subscription created',
      },
    ];

    const values = [
      request.organizationId, // $1
      request.stripeCustomerId, // $2
      request.stripeSubscriptionId, // $3
      request.stripePriceId, // $4
      request.planName, // $5
      request.billingInterval, // $6
      request.planAmount, // $7
      'USD', // $8
      request.clientLimit, // $9
      request.caregiverLimit, // $10
      request.visitLimit ?? null, // $11
      request.trialEnd ? 'trialing' : 'active', // $12
      JSON.stringify(statusHistory), // $13
      now, // $14
      currentPeriodEnd, // $15
      request.trialEnd ? now : null, // $16
      request.trialEnd ?? null, // $17
      false, // $18
      request.createdBy, // $19
      request.createdBy, // $20
    ];

    const result = await this.db.query<Record<string, unknown>>(query, values);
    if (!result.rows[0]) {
      throw new Error('Failed to create subscription');
    }
    return this.mapSubscription(result.rows[0]);
  }

  async getSubscriptionById(id: UUID): Promise<Subscription | null> {
    const query = `
      SELECT * FROM subscriptions
      WHERE id = $1
    `;

    const result = await this.db.query<Record<string, unknown>>(query, [id]);
    return result.rows[0] ? this.mapSubscription(result.rows[0]) : null;
  }

  async getSubscriptionByOrganization(organizationId: UUID): Promise<Subscription | null> {
    const query = `
      SELECT * FROM subscriptions
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query<Record<string, unknown>>(query, [organizationId]);
    return result.rows[0] ? this.mapSubscription(result.rows[0]) : null;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const query = `
      SELECT * FROM subscriptions
      WHERE stripe_subscription_id = $1
    `;

    const result = await this.db.query<Record<string, unknown>>(query, [stripeSubscriptionId]);
    return result.rows[0] ? this.mapSubscription(result.rows[0]) : null;
  }

  async updateSubscriptionStatus(
    id: UUID,
    status: SubscriptionStatus,
    updatedBy: UUID,
    reason?: string
  ): Promise<void> {
    // First get current subscription to append to status history
    const current = await this.getSubscriptionById(id);
    if (!current) {
      throw new NotFoundError('Subscription not found', { id });
    }

    const statusHistory = [
      ...current.statusHistory,
      {
        status,
        timestamp: new Date().toISOString(),
        reason: reason ?? `Status updated to ${status}`,
      },
    ];

    const query = `
      UPDATE subscriptions
      SET status = $1,
          status_history = $2,
          updated_by = $3
      WHERE id = $4
    `;

    await this.db.query(query, [status, JSON.stringify(statusHistory), updatedBy, id]);
  }

  async updateSubscriptionPeriod(
    id: UUID,
    periodStart: Date,
    periodEnd: Date,
    updatedBy: UUID
  ): Promise<void> {
    const query = `
      UPDATE subscriptions
      SET current_period_start = $1,
          current_period_end = $2,
          updated_by = $3
      WHERE id = $4
    `;

    await this.db.query(query, [periodStart, periodEnd, updatedBy, id]);
  }

  async cancelSubscription(id: UUID, canceledBy: UUID, reason?: string): Promise<void> {
    const current = await this.getSubscriptionById(id);
    if (!current) {
      throw new NotFoundError('Subscription not found', { id });
    }

    const now = new Date();
    const statusHistory = [
      ...current.statusHistory,
      {
        status: 'canceled' as SubscriptionStatus,
        timestamp: now.toISOString(),
        reason: reason ?? 'Subscription cancelled',
      },
    ];

    const query = `
      UPDATE subscriptions
      SET status = 'canceled',
          status_history = $1,
          canceled_at = $2,
          cancellation_reason = $3,
          updated_by = $4
      WHERE id = $5
    `;

    await this.db.query(query, [
      JSON.stringify(statusHistory),
      now,
      reason ?? null,
      canceledBy,
      id,
    ]);
  }

  async getCurrentUsage(organizationId: UUID): Promise<BillingUsage | null> {
    // First try to get the subscription to find the current period
    const subscription = await this.getSubscriptionByOrganization(organizationId);
    if (!subscription) {
      return null;
    }

    const query = `
      SELECT * FROM billing_usage
      WHERE organization_id = $1
        AND period_start = $2
        AND period_end = $3
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query<Record<string, unknown>>(query, [
      organizationId,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
    ]);

    return result.rows[0] ? this.mapBillingUsage(result.rows[0]) : null;
  }

  async recordUsageSnapshot(
    organizationId: UUID,
    counts: { clients: number; caregivers: number; visits: number },
    recordedBy: UUID
  ): Promise<void> {
    const subscription = await this.getSubscriptionByOrganization(organizationId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found for organization', { organizationId });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to get existing usage record for this period
    const existing = await this.getCurrentUsage(organizationId);

    if (existing) {
      // Update existing record
      const dailySnapshots = [
        ...existing.dailySnapshots,
        {
          date: today.toISOString(),
          clientCount: counts.clients,
          caregiverCount: counts.caregivers,
          visitCount: counts.visits,
        },
      ];

      const query = `
        UPDATE billing_usage
        SET client_count = $1,
            caregiver_count = $2,
            visit_count = $3,
            peak_client_count = GREATEST(peak_client_count, $4),
            peak_caregiver_count = GREATEST(peak_caregiver_count, $5),
            peak_recorded_date = $6,
            client_overage = GREATEST(0, $7 - client_limit),
            caregiver_overage = GREATEST(0, $8 - caregiver_limit),
            visit_overage = CASE 
              WHEN visit_limit IS NULL THEN 0
              ELSE GREATEST(0, $9 - visit_limit)
            END,
            daily_snapshots = $10,
            updated_by = $11
        WHERE id = $12
      `;

      await this.db.query(query, [
        counts.clients, // $1
        counts.caregivers, // $2
        counts.visits, // $3
        counts.clients, // $4
        counts.caregivers, // $5
        today, // $6
        counts.clients, // $7
        counts.caregivers, // $8
        counts.visits, // $9
        JSON.stringify(dailySnapshots), // $10
        recordedBy, // $11
        existing.id, // $12
      ]);
    } else {
      // Create new usage record
      const dailySnapshots = [
        {
          date: today.toISOString(),
          clientCount: counts.clients,
          caregiverCount: counts.caregivers,
          visitCount: counts.visits,
        },
      ];

      const query = `
        INSERT INTO billing_usage (
          organization_id, subscription_id,
          period_start, period_end, period_type,
          client_count, caregiver_count, visit_count, user_count,
          peak_client_count, peak_caregiver_count, peak_recorded_date,
          client_limit, caregiver_limit, visit_limit,
          client_overage, caregiver_overage, visit_overage,
          overage_charges, total_charges,
          status, is_billed,
          daily_snapshots,
          created_by, updated_by
        ) VALUES (
          $1, $2,
          $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18,
          $19, $20,
          $21, $22,
          $23,
          $24, $25
        )
      `;

      await this.db.query(query, [
        organizationId, // $1
        subscription.id, // $2
        subscription.currentPeriodStart, // $3
        subscription.currentPeriodEnd, // $4
        'monthly', // $5
        counts.clients, // $6
        counts.caregivers, // $7
        counts.visits, // $8
        0, // $9 - user_count (TODO)
        counts.clients, // $10 - peak_client_count
        counts.caregivers, // $11 - peak_caregiver_count
        today, // $12 - peak_recorded_date
        subscription.clientLimit, // $13
        subscription.caregiverLimit, // $14
        subscription.visitLimit, // $15
        Math.max(0, counts.clients - subscription.clientLimit), // $16
        Math.max(0, counts.caregivers - subscription.caregiverLimit), // $17
        subscription.visitLimit ? Math.max(0, counts.visits - subscription.visitLimit) : 0, // $18
        0, // $19 - overage_charges (TODO: calculate based on pricing)
        subscription.planAmount, // $20 - total_charges
        'ACTIVE', // $21
        false, // $22
        JSON.stringify(dailySnapshots), // $23
        recordedBy, // $24
        recordedBy, // $25
      ]);
    }
  }

  private mapSubscription(row: Record<string, unknown>): Subscription {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      stripeCustomerId: row.stripe_customer_id as string,
      stripeSubscriptionId: row.stripe_subscription_id as string,
      stripePriceId: row.stripe_price_id as string | null,
      planName: row.plan_name as PlanName,
      billingInterval: row.billing_interval as 'month' | 'year',
      planAmount: Number(row.plan_amount),
      currency: row.currency as string,
      clientLimit: row.client_limit as number,
      caregiverLimit: row.caregiver_limit as number,
      visitLimit: row.visit_limit as number | null,
      status: row.status as SubscriptionStatus,
      statusHistory: typeof row.status_history === 'string' 
        ? JSON.parse(row.status_history) 
        : row.status_history as Array<{ status: SubscriptionStatus; timestamp: string; reason?: string }>,
      currentPeriodStart: new Date(row.current_period_start as string),
      currentPeriodEnd: new Date(row.current_period_end as string),
      trialStart: row.trial_start ? new Date(row.trial_start as string) : null,
      trialEnd: row.trial_end ? new Date(row.trial_end as string) : null,
      cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
      canceledAt: row.canceled_at ? new Date(row.canceled_at as string) : null,
      endedAt: row.ended_at ? new Date(row.ended_at as string) : null,
      paymentMethodId: row.payment_method_id as string | null,
      paymentMethodDetails: row.payment_method_details as Record<string, unknown> | null,
      lastInvoiceDate: row.last_invoice_date ? new Date(row.last_invoice_date as string) : null,
      lastInvoiceStatus: row.last_invoice_status as string | null,
      metadata: row.metadata as Record<string, unknown> | null,
      cancellationReason: row.cancellation_reason as string | null,
      notes: row.notes as string | null,
      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as UUID,
      updatedAt: new Date(row.updated_at as string),
      updatedBy: row.updated_by as UUID,
      version: row.version as number,
    };
  }

  private mapBillingUsage(row: Record<string, unknown>): BillingUsage {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      subscriptionId: row.subscription_id as UUID,
      periodStart: new Date(row.period_start as string),
      periodEnd: new Date(row.period_end as string),
      periodType: row.period_type as 'daily' | 'weekly' | 'monthly' | 'yearly',
      clientCount: row.client_count as number,
      caregiverCount: row.caregiver_count as number,
      visitCount: row.visit_count as number,
      userCount: row.user_count as number,
      peakClientCount: row.peak_client_count as number,
      peakCaregiverCount: row.peak_caregiver_count as number,
      peakRecordedDate: row.peak_recorded_date ? new Date(row.peak_recorded_date as string) : null,
      clientLimit: row.client_limit as number,
      caregiverLimit: row.caregiver_limit as number,
      visitLimit: row.visit_limit as number | null,
      clientOverage: row.client_overage as number,
      caregiverOverage: row.caregiver_overage as number,
      visitOverage: row.visit_overage as number,
      overageCharges: Number(row.overage_charges),
      totalCharges: Number(row.total_charges),
      status: row.status as 'ACTIVE' | 'BILLED' | 'ARCHIVED',
      isBilled: row.is_billed as boolean,
      billedDate: row.billed_date ? new Date(row.billed_date as string) : null,
      dailySnapshots: typeof row.daily_snapshots === 'string'
        ? JSON.parse(row.daily_snapshots)
        : row.daily_snapshots as Array<{ date: string; clientCount: number; caregiverCount: number; visitCount: number }>,
      notes: row.notes as string | null,
      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as UUID,
      updatedAt: new Date(row.updated_at as string),
      updatedBy: row.updated_by as UUID,
      version: row.version as number,
    };
  }
}
