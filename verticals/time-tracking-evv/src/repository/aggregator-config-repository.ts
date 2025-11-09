/**
 * Aggregator Config Repository
 *
 * Handles data access for state-specific aggregator configurations.
 * Provides methods to retrieve configuration for organizations and states.
 */

import { UUID } from '@care-commons/core';
import { StateCode, TexasEVVConfig, FloridaEVVConfig } from '../types/state-specific.js';
import { StateEVVConfig } from '../aggregators/base-aggregator.js';
import type { Knex } from 'knex';

/**
 * Database row for evv_state_config table
 */
interface StateConfigRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  state_code: string;
  aggregator_type: string;
  aggregator_entity_id: string;
  aggregator_endpoint: string;
  aggregator_api_key_encrypted: string | null;
  aggregator_auth_endpoint: string | null;
  aggregator_client_id: string | null;
  aggregator_client_secret_encrypted: string | null;
  aggregator_metadata: unknown | null;
  program_type: string;
  allowed_clock_methods: unknown;
  requires_gps_for_mobile: boolean;
  geo_perimeter_tolerance: number;
  clock_in_grace_period: number;
  clock_out_grace_period: number;
  late_clock_in_threshold: number;
  vmur_enabled: boolean;
  vmur_approval_required: boolean;
  vmur_reason_codes_required: boolean;
  additional_aggregators: unknown | null;
  mco_requirements: unknown | null;
  retention_years: number | null;
  immutable_after_days: number | null;
  is_active: boolean;
  effective_from: Date;
  effective_to: Date | null;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

/**
 * Aggregator Config Repository
 *
 * SOLID: Single Responsibility - Only handles database operations for configs
 * Separation of Concerns: SQL logic isolated from business logic
 */
export class AggregatorConfigRepository {
  constructor(private db: Knex) {}

  /**
   * Get state configuration for an organization and state
   *
   * @param organizationId - Organization ID
   * @param branchId - Optional branch ID for branch-specific config
   * @param stateCode - State code
   * @returns State configuration or null if not found
   */
  async getStateConfig(
    organizationId: UUID,
    branchId: UUID | null,
    stateCode: StateCode
  ): Promise<TexasEVVConfig | FloridaEVVConfig | StateEVVConfig | null> {
    // Try to find branch-specific config first, then org-level config
    let row: StateConfigRow | undefined;

    if (branchId) {
      row = await this.db('evv_state_config')
        .where({
          organization_id: organizationId,
          branch_id: branchId,
          state_code: stateCode,
          is_active: true,
        })
        .where('effective_from', '<=', new Date())
        .where(function (this: Knex.QueryBuilder) {
          this.whereNull('effective_to').orWhere('effective_to', '>=', new Date());
        })
        .first();
    }

    // Fall back to organization-level config
    if (!row) {
      row = await this.db('evv_state_config')
        .where({
          organization_id: organizationId,
          state_code: stateCode,
          is_active: true,
        })
        .whereNull('branch_id')
        .where('effective_from', '<=', new Date())
        .where(function (this: Knex.QueryBuilder) {
          this.whereNull('effective_to').orWhere('effective_to', '>=', new Date());
        })
        .first();
    }

    if (!row) {
      return null;
    }

    return this.mapRowToConfig(row);
  }

  /**
   * Get all active configurations for an organization
   */
  async getActiveConfigsForOrganization(
    organizationId: UUID
  ): Promise<Array<TexasEVVConfig | FloridaEVVConfig | StateEVVConfig>> {
    const rows = await this.db('evv_state_config')
      .where({
        organization_id: organizationId,
        is_active: true,
      })
      .where('effective_from', '<=', new Date())
      .where(function (this: Knex.QueryBuilder) {
        this.whereNull('effective_to').orWhere('effective_to', '>=', new Date());
      })
      .orderBy('state_code', 'asc');

    return rows.map(row => this.mapRowToConfig(row));
  }

  /**
   * Create a new state configuration
   */
  async createConfig(
    organizationId: UUID,
    createdBy: UUID,
    config: Omit<StateEVVConfig, 'state'> & { stateCode: StateCode }
  ): Promise<StateEVVConfig> {
    const configRecord = config as any;
    const row: Partial<StateConfigRow> = {
      organization_id: organizationId,
      state_code: config.stateCode,
      aggregator_type: config.aggregatorType,
      aggregator_entity_id: configRecord['aggregatorEntityId'] || '',
      aggregator_endpoint: config.aggregatorEndpoint,
      aggregator_api_key_encrypted: config.aggregatorApiKey || null,
      aggregator_auth_endpoint: configRecord['aggregatorAuthEndpoint'] || null,
      aggregator_client_id: configRecord['aggregatorClientId'] || null,
      aggregator_client_secret_encrypted: configRecord['aggregatorClientSecretEncrypted'] || null,
      aggregator_metadata: configRecord['aggregatorMetadata'] || null,
      program_type: 'MEDICAID', // Default
      allowed_clock_methods: JSON.stringify(['MOBILE_GPS', 'FIXED_TELEPHONY']),
      requires_gps_for_mobile: true,
      geo_perimeter_tolerance: config.geofenceRadiusMeters || 100,
      clock_in_grace_period: config.gracePeriodMinutes || 10,
      clock_out_grace_period: config.gracePeriodMinutes || 10,
      late_clock_in_threshold: 15,
      vmur_enabled: false,
      vmur_approval_required: true,
      vmur_reason_codes_required: true,
      retention_years: 6,
      immutable_after_days: 30,
      is_active: true,
      effective_from: new Date(),
      created_by: createdBy,
      updated_by: createdBy,
    };

    const [inserted] = await this.db('evv_state_config')
      .insert(row)
      .returning('*');

    return this.mapRowToConfig(inserted);
  }

  /**
   * Update an existing configuration
   */
  async updateConfig(
    configId: UUID,
    updatedBy: UUID,
    updates: Partial<StateEVVConfig>
  ): Promise<StateEVVConfig> {
    const row: Partial<StateConfigRow> = {
      updated_by: updatedBy,
    };

    if (updates.aggregatorEndpoint) row.aggregator_endpoint = updates.aggregatorEndpoint;
    if (updates.aggregatorApiKey) row.aggregator_api_key_encrypted = updates.aggregatorApiKey;
    if (updates.geofenceRadiusMeters) row.geo_perimeter_tolerance = updates.geofenceRadiusMeters;
    if (updates.gracePeriodMinutes) {
      row.clock_in_grace_period = updates.gracePeriodMinutes;
      row.clock_out_grace_period = updates.gracePeriodMinutes;
    }

    const [updated] = await this.db('evv_state_config')
      .where({ id: configId })
      .update(row)
      .returning('*');

    if (!updated) {
      throw new Error(`State config not found: ${configId}`);
    }

    return this.mapRowToConfig(updated);
  }

  /**
   * Deactivate a configuration
   */
  async deactivateConfig(configId: UUID, updatedBy: UUID): Promise<void> {
    await this.db('evv_state_config')
      .where({ id: configId })
      .update({
        is_active: false,
        effective_to: new Date(),
        updated_by: updatedBy,
      });
  }

  /**
   * Map database row to domain model
   */
  private mapRowToConfig(row: StateConfigRow): StateEVVConfig {
    const baseConfig: StateEVVConfig = {
      state: row.state_code as StateCode,
      aggregatorType: row.aggregator_type,
      aggregatorEndpoint: row.aggregator_endpoint,
      aggregatorApiKey: row.aggregator_api_key_encrypted || undefined,
      gracePeriodMinutes: row.clock_in_grace_period,
      geofenceRadiusMeters: row.geo_perimeter_tolerance,
      retryPolicy: {
        maxRetries: 3,
        backoffType: 'EXPONENTIAL',
        baseDelaySeconds: 60,
        maxDelaySeconds: 1800,
      },
    };

    // Add state-specific fields
    if (row.aggregator_auth_endpoint) {
      (baseConfig as Record<string, unknown>)['aggregatorAuthEndpoint'] = row.aggregator_auth_endpoint;
    }
    if (row.aggregator_client_id) {
      (baseConfig as Record<string, unknown>)['aggregatorClientId'] = row.aggregator_client_id;
    }
    if (row.aggregator_client_secret_encrypted) {
      (baseConfig as Record<string, unknown>)['aggregatorClientSecretEncrypted'] = row.aggregator_client_secret_encrypted;
    }
    if (row.aggregator_metadata) {
      (baseConfig as Record<string, unknown>)['aggregatorMetadata'] = row.aggregator_metadata;
    }

    return baseConfig;
  }
}
