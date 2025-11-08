/**
 * @care-commons/core - Subscription Repository
 *
 * Data access layer for organization subscriptions and billing
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import {
  OrganizationSubscription,
  SubscriptionPlanTier,
  SubscriptionStatus,
  UpdateSubscriptionRequest,
} from '../types/white-label';

export interface ISubscriptionRepository {
  getSubscriptionByOrganizationId(
    organizationId: UUID
  ): Promise<OrganizationSubscription | null>;
  getSubscriptionsByStatus(status: SubscriptionStatus): Promise<OrganizationSubscription[]>;
  getSubscriptionsByPlanTier(planTier: SubscriptionPlanTier): Promise<OrganizationSubscription[]>;
  getAllSubscriptions(): Promise<OrganizationSubscription[]>;
  createSubscription(
    organizationId: UUID,
    planTier: SubscriptionPlanTier,
    createdBy: UUID
  ): Promise<OrganizationSubscription>;
  updateSubscription(
    organizationId: UUID,
    updates: UpdateSubscriptionRequest,
    updatedBy: UUID
  ): Promise<OrganizationSubscription>;
  cancelSubscription(
    organizationId: UUID,
    reason: string,
    cancelledBy: UUID
  ): Promise<void>;
  suspendSubscription(organizationId: UUID, updatedBy: UUID): Promise<void>;
  activateSubscription(organizationId: UUID, updatedBy: UUID): Promise<void>;
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private db: Database) {}

  async getSubscriptionByOrganizationId(
    organizationId: UUID
  ): Promise<OrganizationSubscription | null> {
    const query = `
      SELECT
        id, organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, trial_ends_at, current_period_start, current_period_end,
        cancelled_at, cancellation_reason,
        stripe_customer_id, stripe_subscription_id,
        created_at, created_by, updated_at, updated_by
      FROM organization_subscriptions
      WHERE organization_id = $1
    `;

    const result = await this.db.query<SubscriptionRow>(query, [organizationId]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToSubscription(row);
  }

  async getSubscriptionsByStatus(status: SubscriptionStatus): Promise<OrganizationSubscription[]> {
    const query = `
      SELECT
        id, organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, trial_ends_at, current_period_start, current_period_end,
        cancelled_at, cancellation_reason,
        stripe_customer_id, stripe_subscription_id,
        created_at, created_by, updated_at, updated_by
      FROM organization_subscriptions
      WHERE status = $1
      ORDER BY created_at DESC
    `;

    const result = await this.db.query<SubscriptionRow>(query, [status]);

    return result.rows.map((row) => this.mapRowToSubscription(row));
  }

  async getSubscriptionsByPlanTier(
    planTier: SubscriptionPlanTier
  ): Promise<OrganizationSubscription[]> {
    const query = `
      SELECT
        id, organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, trial_ends_at, current_period_start, current_period_end,
        cancelled_at, cancellation_reason,
        stripe_customer_id, stripe_subscription_id,
        created_at, created_by, updated_at, updated_by
      FROM organization_subscriptions
      WHERE plan_tier = $1
      ORDER BY created_at DESC
    `;

    const result = await this.db.query<SubscriptionRow>(query, [planTier]);

    return result.rows.map((row) => this.mapRowToSubscription(row));
  }

  async getAllSubscriptions(): Promise<OrganizationSubscription[]> {
    const query = `
      SELECT
        id, organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, trial_ends_at, current_period_start, current_period_end,
        cancelled_at, cancellation_reason,
        stripe_customer_id, stripe_subscription_id,
        created_at, created_by, updated_at, updated_by
      FROM organization_subscriptions
      ORDER BY created_at DESC
    `;

    const result = await this.db.query<SubscriptionRow>(query, []);

    return result.rows.map((row) => this.mapRowToSubscription(row));
  }

  async createSubscription(
    organizationId: UUID,
    planTier: SubscriptionPlanTier,
    createdBy: UUID
  ): Promise<OrganizationSubscription> {
    // Define default limits by plan tier
    const planDefaults = this.getPlanDefaults(planTier);

    const query = `
      INSERT INTO organization_subscriptions (
        organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, current_period_start, current_period_end,
        created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW() + INTERVAL '30 days',
        $13, $13
      )
      RETURNING
        id, organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, trial_ends_at, current_period_start, current_period_end,
        cancelled_at, cancellation_reason,
        stripe_customer_id, stripe_subscription_id,
        created_at, created_by, updated_at, updated_by
    `;

    const values = [
      organizationId,
      planTier,
      'MONTHLY',
      planDefaults.monthlyPrice,
      'USD',
      planDefaults.maxUsers,
      planDefaults.maxClients,
      planDefaults.maxCaregivers,
      planDefaults.whiteLabelingEnabled,
      planDefaults.customDomainEnabled,
      planDefaults.apiAccessEnabled,
      'ACTIVE',
      createdBy,
    ];

    const result = await this.db.query<SubscriptionRow>(query, values);

    return this.mapRowToSubscription(result.rows[0]!);
  }

  async updateSubscription(
    organizationId: UUID,
    updates: UpdateSubscriptionRequest,
    updatedBy: UUID
  ): Promise<OrganizationSubscription> {
    const updateFields: string[] = [];
    const values: unknown[] = [organizationId, updatedBy];
    let paramIndex = 3;

    if (updates.planTier !== undefined) {
      updateFields.push(`plan_tier = $${paramIndex++}`);
      values.push(updates.planTier);
    }
    if (updates.billingCycle !== undefined) {
      updateFields.push(`billing_cycle = $${paramIndex++}`);
      values.push(updates.billingCycle);
    }
    if (updates.maxUsers !== undefined) {
      updateFields.push(`max_users = $${paramIndex++}`);
      values.push(updates.maxUsers);
    }
    if (updates.maxClients !== undefined) {
      updateFields.push(`max_clients = $${paramIndex++}`);
      values.push(updates.maxClients);
    }
    if (updates.maxCaregivers !== undefined) {
      updateFields.push(`max_caregivers = $${paramIndex++}`);
      values.push(updates.maxCaregivers);
    }
    if (updates.whiteLabelingEnabled !== undefined) {
      updateFields.push(`white_labeling_enabled = $${paramIndex++}`);
      values.push(updates.whiteLabelingEnabled);
    }
    if (updates.customDomainEnabled !== undefined) {
      updateFields.push(`custom_domain_enabled = $${paramIndex++}`);
      values.push(updates.customDomainEnabled);
    }
    if (updates.apiAccessEnabled !== undefined) {
      updateFields.push(`api_access_enabled = $${paramIndex++}`);
      values.push(updates.apiAccessEnabled);
    }

    if (updateFields.length === 0) {
      // No updates, just return current
      const current = await this.getSubscriptionByOrganizationId(organizationId);
      if (!current) {
        throw new Error('Subscription not found');
      }
      return current;
    }

    const query = `
      UPDATE organization_subscriptions
      SET ${updateFields.join(', ')}, updated_by = $2, updated_at = NOW()
      WHERE organization_id = $1
      RETURNING
        id, organization_id, plan_tier, billing_cycle, monthly_price, currency,
        max_users, max_clients, max_caregivers,
        white_labeling_enabled, custom_domain_enabled, api_access_enabled,
        status, trial_ends_at, current_period_start, current_period_end,
        cancelled_at, cancellation_reason,
        stripe_customer_id, stripe_subscription_id,
        created_at, created_by, updated_at, updated_by
    `;

    const result = await this.db.query<SubscriptionRow>(query, values);

    const row = result.rows[0];
    if (!row) {
      throw new Error('Subscription not found');
    }

    return this.mapRowToSubscription(row);
  }

  async cancelSubscription(
    organizationId: UUID,
    reason: string,
    cancelledBy: UUID
  ): Promise<void> {
    const query = `
      UPDATE organization_subscriptions
      SET status = 'CANCELLED',
          cancelled_at = NOW(),
          cancellation_reason = $2,
          updated_by = $3,
          updated_at = NOW()
      WHERE organization_id = $1
    `;

    await this.db.query(query, [organizationId, reason, cancelledBy]);
  }

  async suspendSubscription(organizationId: UUID, updatedBy: UUID): Promise<void> {
    const query = `
      UPDATE organization_subscriptions
      SET status = 'SUSPENDED',
          updated_by = $2,
          updated_at = NOW()
      WHERE organization_id = $1
    `;

    await this.db.query(query, [organizationId, updatedBy]);
  }

  async activateSubscription(organizationId: UUID, updatedBy: UUID): Promise<void> {
    const query = `
      UPDATE organization_subscriptions
      SET status = 'ACTIVE',
          updated_by = $2,
          updated_at = NOW()
      WHERE organization_id = $1
    `;

    await this.db.query(query, [organizationId, updatedBy]);
  }

  private getPlanDefaults(planTier: SubscriptionPlanTier) {
    switch (planTier) {
      case 'FREE':
        return {
          monthlyPrice: 0,
          maxUsers: 5,
          maxClients: 50,
          maxCaregivers: 25,
          whiteLabelingEnabled: false,
          customDomainEnabled: false,
          apiAccessEnabled: false,
        };
      case 'BASIC':
        return {
          monthlyPrice: 99,
          maxUsers: 20,
          maxClients: 200,
          maxCaregivers: 100,
          whiteLabelingEnabled: false,
          customDomainEnabled: false,
          apiAccessEnabled: false,
        };
      case 'PROFESSIONAL':
        return {
          monthlyPrice: 299,
          maxUsers: 100,
          maxClients: 1000,
          maxCaregivers: 500,
          whiteLabelingEnabled: true,
          customDomainEnabled: true,
          apiAccessEnabled: true,
        };
      case 'ENTERPRISE':
        return {
          monthlyPrice: 999,
          maxUsers: null,
          maxClients: null,
          maxCaregivers: null,
          whiteLabelingEnabled: true,
          customDomainEnabled: true,
          apiAccessEnabled: true,
        };
      case 'CUSTOM':
        return {
          monthlyPrice: 0,
          maxUsers: null,
          maxClients: null,
          maxCaregivers: null,
          whiteLabelingEnabled: true,
          customDomainEnabled: true,
          apiAccessEnabled: true,
        };
    }
  }

  private mapRowToSubscription(row: SubscriptionRow): OrganizationSubscription {
    return {
      id: row.id,
      organizationId: row.organization_id,
      planTier: row.plan_tier as SubscriptionPlanTier,
      billingCycle: row.billing_cycle as 'MONTHLY' | 'ANNUAL',
      monthlyPrice: parseFloat(row.monthly_price),
      currency: row.currency,
      maxUsers: row.max_users,
      maxClients: row.max_clients,
      maxCaregivers: row.max_caregivers,
      whiteLabelingEnabled: row.white_labeling_enabled,
      customDomainEnabled: row.custom_domain_enabled,
      apiAccessEnabled: row.api_access_enabled,
      status: row.status as SubscriptionStatus,
      trialEndsAt: row.trial_ends_at,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: 1,
    };
  }
}

interface SubscriptionRow extends Record<string, unknown> {
  id: string;
  organization_id: string;
  plan_tier: string;
  billing_cycle: string;
  monthly_price: string; // Numeric from DB
  currency: string;
  max_users: number | null;
  max_clients: number | null;
  max_caregivers: number | null;
  white_labeling_enabled: boolean;
  custom_domain_enabled: boolean;
  api_access_enabled: boolean;
  status: string;
  trial_ends_at: Date | null;
  current_period_start: Date;
  current_period_end: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
}
