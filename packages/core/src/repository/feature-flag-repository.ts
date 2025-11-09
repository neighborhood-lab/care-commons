/**
 * @care-commons/core - Feature Flag Repository
 *
 * Data access layer for per-organization feature flags
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import {
  FeatureFlag,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
} from '../types/feature-flags';

export interface IFeatureFlagRepository {
  getFeatureFlagsByOrganizationId(organizationId: UUID): Promise<FeatureFlag[]>;
  getFeatureFlagByKey(organizationId: UUID, featureKey: string): Promise<FeatureFlag | null>;
  createFeatureFlag(
    organizationId: UUID,
    request: CreateFeatureFlagRequest,
    userId: UUID
  ): Promise<FeatureFlag>;
  updateFeatureFlag(
    id: UUID,
    request: UpdateFeatureFlagRequest,
    userId: UUID
  ): Promise<FeatureFlag>;
  deleteFeatureFlag(id: UUID): Promise<void>;
  isFeatureEnabled(organizationId: UUID, featureKey: string, userId?: UUID): Promise<boolean>;
}

export class FeatureFlagRepository implements IFeatureFlagRepository {
  constructor(private db: Database) {}

  async getFeatureFlagsByOrganizationId(organizationId: UUID): Promise<FeatureFlag[]> {
    const query = `
      SELECT
        id, organization_id, feature_key, feature_name, description,
        is_enabled, enabled_at, enabled_by, configuration, limits,
        rollout_percentage, rollout_user_ids, rollout_branch_ids,
        billing_tier, monthly_cost, requires_upgrade, depends_on, conflicts_with,
        created_at, created_by, updated_at, updated_by, version
      FROM feature_flags
      WHERE organization_id = $1
      ORDER BY feature_name
    `;

    const result = await this.db.query<FeatureFlagRow>(query, [organizationId]);
    return result.rows.map((row) => this.mapRowToFeatureFlag(row));
  }

  async getFeatureFlagByKey(
    organizationId: UUID,
    featureKey: string
  ): Promise<FeatureFlag | null> {
    const query = `
      SELECT
        id, organization_id, feature_key, feature_name, description,
        is_enabled, enabled_at, enabled_by, configuration, limits,
        rollout_percentage, rollout_user_ids, rollout_branch_ids,
        billing_tier, monthly_cost, requires_upgrade, depends_on, conflicts_with,
        created_at, created_by, updated_at, updated_by, version
      FROM feature_flags
      WHERE organization_id = $1 AND feature_key = $2
    `;

    const result = await this.db.query<FeatureFlagRow>(query, [organizationId, featureKey]);
    const row = result.rows[0];
    return row ? this.mapRowToFeatureFlag(row) : null;
  }

  async createFeatureFlag(
    organizationId: UUID,
    request: CreateFeatureFlagRequest,
    userId: UUID
  ): Promise<FeatureFlag> {
    const query = `
      INSERT INTO feature_flags (
        organization_id, feature_key, feature_name, description, is_enabled,
        configuration, limits, rollout_percentage, rollout_user_ids, rollout_branch_ids,
        billing_tier, monthly_cost, requires_upgrade, depends_on, conflicts_with,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $16
      )
      RETURNING
        id, organization_id, feature_key, feature_name, description,
        is_enabled, enabled_at, enabled_by, configuration, limits,
        rollout_percentage, rollout_user_ids, rollout_branch_ids,
        billing_tier, monthly_cost, requires_upgrade, depends_on, conflicts_with,
        created_at, created_by, updated_at, updated_by, version
    `;

    const result = await this.db.query<FeatureFlagRow>(query, [
      organizationId,
      request.featureKey,
      request.featureName,
      request.description ?? null,
      request.isEnabled ?? false,
      request.configuration ? JSON.stringify(request.configuration) : null,
      request.limits ? JSON.stringify(request.limits) : null,
      request.rolloutPercentage ?? 100,
      request.rolloutUserIds ?? [],
      request.rolloutBranchIds ?? [],
      request.billingTier ?? null,
      request.monthlyCost ?? null,
      request.requiresUpgrade ?? false,
      request.dependsOn ?? [],
      request.conflictsWith ?? [],
      userId,
    ]);

    return this.mapRowToFeatureFlag(result.rows[0]!);
  }

  async updateFeatureFlag(
    id: UUID,
    request: UpdateFeatureFlagRequest,
    userId: UUID
  ): Promise<FeatureFlag> {
    const updateFields: string[] = [];
    const values: unknown[] = [id];
    let paramIndex = 2;

    if (request.featureName !== undefined) {
      updateFields.push(`feature_name = $${paramIndex++}`);
      values.push(request.featureName);
    }
    if (request.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(request.description);
    }
    if (request.isEnabled !== undefined) {
      updateFields.push(`is_enabled = $${paramIndex++}`);
      values.push(request.isEnabled);
      if (request.isEnabled) {
        updateFields.push(`enabled_at = NOW(), enabled_by = $${paramIndex++}`);
        values.push(userId);
      }
    }
    if (request.configuration !== undefined) {
      updateFields.push(`configuration = $${paramIndex++}`);
      values.push(request.configuration ? JSON.stringify(request.configuration) : null);
    }
    if (request.limits !== undefined) {
      updateFields.push(`limits = $${paramIndex++}`);
      values.push(request.limits ? JSON.stringify(request.limits) : null);
    }
    if (request.rolloutPercentage !== undefined) {
      updateFields.push(`rollout_percentage = $${paramIndex++}`);
      values.push(request.rolloutPercentage);
    }
    if (request.rolloutUserIds !== undefined) {
      updateFields.push(`rollout_user_ids = $${paramIndex++}`);
      values.push(request.rolloutUserIds);
    }
    if (request.rolloutBranchIds !== undefined) {
      updateFields.push(`rollout_branch_ids = $${paramIndex++}`);
      values.push(request.rolloutBranchIds);
    }
    if (request.billingTier !== undefined) {
      updateFields.push(`billing_tier = $${paramIndex++}`);
      values.push(request.billingTier);
    }
    if (request.monthlyCost !== undefined) {
      updateFields.push(`monthly_cost = $${paramIndex++}`);
      values.push(request.monthlyCost);
    }
    if (request.requiresUpgrade !== undefined) {
      updateFields.push(`requires_upgrade = $${paramIndex++}`);
      values.push(request.requiresUpgrade);
    }
    if (request.dependsOn !== undefined) {
      updateFields.push(`depends_on = $${paramIndex++}`);
      values.push(request.dependsOn);
    }
    if (request.conflictsWith !== undefined) {
      updateFields.push(`conflicts_with = $${paramIndex++}`);
      values.push(request.conflictsWith);
    }

    updateFields.push(`updated_by = $${paramIndex++}, version = version + 1`);
    values.push(userId);

    const query = `
      UPDATE feature_flags
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, organization_id, feature_key, feature_name, description,
        is_enabled, enabled_at, enabled_by, configuration, limits,
        rollout_percentage, rollout_user_ids, rollout_branch_ids,
        billing_tier, monthly_cost, requires_upgrade, depends_on, conflicts_with,
        created_at, created_by, updated_at, updated_by, version
    `;

    const result = await this.db.query<FeatureFlagRow>(query, values);
    return this.mapRowToFeatureFlag(result.rows[0]!);
  }

  async deleteFeatureFlag(id: UUID): Promise<void> {
    const query = `DELETE FROM feature_flags WHERE id = $1`;
    await this.db.query(query, [id]);
  }

  async isFeatureEnabled(
    organizationId: UUID,
    featureKey: string,
    userId?: UUID
  ): Promise<boolean> {
    const flag = await this.getFeatureFlagByKey(organizationId, featureKey);

    if (!flag || !flag.isEnabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100 && userId) {
      // Simple hash-based percentage check
      const hash = this.hashUserId(userId);
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check if user is in rollout list
    if (flag.rolloutUserIds.length > 0 && userId) {
      return flag.rolloutUserIds.includes(userId);
    }

    return true;
  }

  private mapRowToFeatureFlag(row: FeatureFlagRow): FeatureFlag {
    return {
      id: row.id,
      organizationId: row.organization_id,
      featureKey: row.feature_key,
      featureName: row.feature_name,
      description: row.description,
      isEnabled: row.is_enabled,
      enabledAt: row.enabled_at,
      enabledBy: row.enabled_by,
      configuration: row.configuration,
      limits: row.limits,
      rolloutPercentage: row.rollout_percentage,
      rolloutUserIds: row.rollout_user_ids,
      rolloutBranchIds: row.rollout_branch_ids,
      billingTier: row.billing_tier,
      monthlyCost: row.monthly_cost,
      requiresUpgrade: row.requires_upgrade,
      dependsOn: row.depends_on,
      conflictsWith: row.conflicts_with,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  private hashUserId(userId: UUID): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

interface FeatureFlagRow {
  [key: string]: unknown;
  id: string;
  organization_id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  enabled_at: Date | null;
  enabled_by: string | null;
  configuration: Record<string, unknown> | null;
  limits: Record<string, number> | null;
  rollout_percentage: number;
  rollout_user_ids: string[];
  rollout_branch_ids: string[];
  billing_tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | 'CUSTOM' | null;
  monthly_cost: number | null;
  requires_upgrade: boolean;
  depends_on: string[];
  conflicts_with: string[];
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}
