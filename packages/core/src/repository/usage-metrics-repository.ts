/**
 * @care-commons/core - Usage Metrics Repository
 *
 * Data access layer for organization usage tracking
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import { OrganizationUsageMetrics } from '../types/white-label';

export interface IUsageMetricsRepository {
  getMetricsByOrganizationAndDate(
    organizationId: UUID,
    metricDate: Date
  ): Promise<OrganizationUsageMetrics | null>;
  getMetricsByOrganizationDateRange(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<OrganizationUsageMetrics[]>;
  getLatestMetricsByOrganization(organizationId: UUID): Promise<OrganizationUsageMetrics | null>;
  getAllMetricsForDate(metricDate: Date): Promise<OrganizationUsageMetrics[]>;
  upsertMetrics(
    organizationId: UUID,
    metricDate: Date,
    metrics: Partial<OrganizationUsageMetrics>
  ): Promise<OrganizationUsageMetrics>;
  incrementMetric(
    organizationId: UUID,
    metricDate: Date,
    metricName: keyof OrganizationUsageMetrics,
    incrementBy: number
  ): Promise<void>;
}

export class UsageMetricsRepository implements IUsageMetricsRepository {
  constructor(private db: Database) {}

  async getMetricsByOrganizationAndDate(
    organizationId: UUID,
    metricDate: Date
  ): Promise<OrganizationUsageMetrics | null> {
    const query = `
      SELECT
        id, organization_id, metric_date,
        active_users, total_users, new_users,
        active_clients, active_caregivers, total_clients, total_caregivers,
        visits_scheduled, visits_completed, evv_records_created,
        invoices_generated, total_billable_hours, total_revenue,
        api_calls, storage_mb,
        created_at, updated_at
      FROM organization_usage_metrics
      WHERE organization_id = $1 AND metric_date = $2
    `;

    const result = await this.db.query<UsageMetricsRow>(query, [organizationId, metricDate]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToMetrics(row);
  }

  async getMetricsByOrganizationDateRange(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<OrganizationUsageMetrics[]> {
    const query = `
      SELECT
        id, organization_id, metric_date,
        active_users, total_users, new_users,
        active_clients, active_caregivers, total_clients, total_caregivers,
        visits_scheduled, visits_completed, evv_records_created,
        invoices_generated, total_billable_hours, total_revenue,
        api_calls, storage_mb,
        created_at, updated_at
      FROM organization_usage_metrics
      WHERE organization_id = $1
        AND metric_date >= $2
        AND metric_date <= $3
      ORDER BY metric_date DESC
    `;

    const result = await this.db.query<UsageMetricsRow>(query, [
      organizationId,
      startDate,
      endDate,
    ]);

    return result.rows.map((row) => this.mapRowToMetrics(row));
  }

  async getLatestMetricsByOrganization(
    organizationId: UUID
  ): Promise<OrganizationUsageMetrics | null> {
    const query = `
      SELECT
        id, organization_id, metric_date,
        active_users, total_users, new_users,
        active_clients, active_caregivers, total_clients, total_caregivers,
        visits_scheduled, visits_completed, evv_records_created,
        invoices_generated, total_billable_hours, total_revenue,
        api_calls, storage_mb,
        created_at, updated_at
      FROM organization_usage_metrics
      WHERE organization_id = $1
      ORDER BY metric_date DESC
      LIMIT 1
    `;

    const result = await this.db.query<UsageMetricsRow>(query, [organizationId]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToMetrics(row);
  }

  async getAllMetricsForDate(metricDate: Date): Promise<OrganizationUsageMetrics[]> {
    const query = `
      SELECT
        id, organization_id, metric_date,
        active_users, total_users, new_users,
        active_clients, active_caregivers, total_clients, total_caregivers,
        visits_scheduled, visits_completed, evv_records_created,
        invoices_generated, total_billable_hours, total_revenue,
        api_calls, storage_mb,
        created_at, updated_at
      FROM organization_usage_metrics
      WHERE metric_date = $1
      ORDER BY organization_id
    `;

    const result = await this.db.query<UsageMetricsRow>(query, [metricDate]);

    return result.rows.map((row) => this.mapRowToMetrics(row));
  }

  async upsertMetrics(
    organizationId: UUID,
    metricDate: Date,
    metrics: Partial<OrganizationUsageMetrics>
  ): Promise<OrganizationUsageMetrics> {
    const query = `
      INSERT INTO organization_usage_metrics (
        organization_id, metric_date,
        active_users, total_users, new_users,
        active_clients, active_caregivers, total_clients, total_caregivers,
        visits_scheduled, visits_completed, evv_records_created,
        invoices_generated, total_billable_hours, total_revenue,
        api_calls, storage_mb
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (organization_id, metric_date)
      DO UPDATE SET
        active_users = EXCLUDED.active_users,
        total_users = EXCLUDED.total_users,
        new_users = EXCLUDED.new_users,
        active_clients = EXCLUDED.active_clients,
        active_caregivers = EXCLUDED.active_caregivers,
        total_clients = EXCLUDED.total_clients,
        total_caregivers = EXCLUDED.total_caregivers,
        visits_scheduled = EXCLUDED.visits_scheduled,
        visits_completed = EXCLUDED.visits_completed,
        evv_records_created = EXCLUDED.evv_records_created,
        invoices_generated = EXCLUDED.invoices_generated,
        total_billable_hours = EXCLUDED.total_billable_hours,
        total_revenue = EXCLUDED.total_revenue,
        api_calls = EXCLUDED.api_calls,
        storage_mb = EXCLUDED.storage_mb,
        updated_at = NOW()
      RETURNING
        id, organization_id, metric_date,
        active_users, total_users, new_users,
        active_clients, active_caregivers, total_clients, total_caregivers,
        visits_scheduled, visits_completed, evv_records_created,
        invoices_generated, total_billable_hours, total_revenue,
        api_calls, storage_mb,
        created_at, updated_at
    `;

    const values = [
      organizationId,
      metricDate,
      metrics.activeUsers ?? 0,
      metrics.totalUsers ?? 0,
      metrics.newUsers ?? 0,
      metrics.activeClients ?? 0,
      metrics.activeCaregivers ?? 0,
      metrics.totalClients ?? 0,
      metrics.totalCaregivers ?? 0,
      metrics.visitsScheduled ?? 0,
      metrics.visitsCompleted ?? 0,
      metrics.evvRecordsCreated ?? 0,
      metrics.invoicesGenerated ?? 0,
      metrics.totalBillableHours ?? 0,
      metrics.totalRevenue ?? 0,
      metrics.apiCalls ?? 0,
      metrics.storageMb ?? 0,
    ];

    const result = await this.db.query<UsageMetricsRow>(query, values);

    return this.mapRowToMetrics(result.rows[0]!);
  }

  async incrementMetric(
    organizationId: UUID,
    metricDate: Date,
    metricName: keyof OrganizationUsageMetrics,
    incrementBy: number
  ): Promise<void> {
    // Map camelCase to snake_case
    const columnMap: Record<string, string> = {
      activeUsers: 'active_users',
      totalUsers: 'total_users',
      newUsers: 'new_users',
      activeClients: 'active_clients',
      activeCaregivers: 'active_caregivers',
      totalClients: 'total_clients',
      totalCaregivers: 'total_caregivers',
      visitsScheduled: 'visits_scheduled',
      visitsCompleted: 'visits_completed',
      evvRecordsCreated: 'evv_records_created',
      invoicesGenerated: 'invoices_generated',
      totalBillableHours: 'total_billable_hours',
      totalRevenue: 'total_revenue',
      apiCalls: 'api_calls',
      storageMb: 'storage_mb',
    };

    const columnName = columnMap[metricName];
    if (!columnName) {
      throw new Error(`Invalid metric name: ${metricName}`);
    }

    const query = `
      INSERT INTO organization_usage_metrics (
        organization_id, metric_date, ${columnName}
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (organization_id, metric_date)
      DO UPDATE SET
        ${columnName} = organization_usage_metrics.${columnName} + EXCLUDED.${columnName},
        updated_at = NOW()
    `;

    await this.db.query(query, [organizationId, metricDate, incrementBy]);
  }

  private mapRowToMetrics(row: UsageMetricsRow): OrganizationUsageMetrics {
    return {
      id: row.id,
      organizationId: row.organization_id,
      metricDate: row.metric_date,
      activeUsers: row.active_users,
      totalUsers: row.total_users,
      newUsers: row.new_users,
      activeClients: row.active_clients,
      activeCaregivers: row.active_caregivers,
      totalClients: row.total_clients,
      totalCaregivers: row.total_caregivers,
      visitsScheduled: row.visits_scheduled,
      visitsCompleted: row.visits_completed,
      evvRecordsCreated: row.evv_records_created,
      invoicesGenerated: row.invoices_generated,
      totalBillableHours: parseFloat(row.total_billable_hours),
      totalRevenue: parseFloat(row.total_revenue),
      apiCalls: row.api_calls,
      storageMb: row.storage_mb,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface UsageMetricsRow extends Record<string, unknown> {
  id: string;
  organization_id: string;
  metric_date: Date;
  active_users: number;
  total_users: number;
  new_users: number;
  active_clients: number;
  active_caregivers: number;
  total_clients: number;
  total_caregivers: number;
  visits_scheduled: number;
  visits_completed: number;
  evv_records_created: number;
  invoices_generated: number;
  total_billable_hours: string; // Numeric from DB
  total_revenue: string; // Numeric from DB
  api_calls: number;
  storage_mb: number;
  created_at: Date;
  updated_at: Date;
}
