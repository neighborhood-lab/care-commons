import { Repository, type Database, type UUID, type UserContext } from '@care-commons/core';
import type {
  MileageEntry,
  MileageRate,
  MileageQueryFilter,
  MileageSummary,
  MileageRateType,
} from '../types/mileage.js';

/**
 * Repository for managing mileage entries in the database
 */
export class MileageRepository extends Repository<MileageEntry> {
  constructor(database: Database) {
    super({
      tableName: 'mileage_entries',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Maps a database row to a MileageEntry entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): MileageEntry {
    return {
      id: row.id as UUID,
      employeeId: row.employee_id as UUID,
      tripDate: row.trip_date as string,
      startLocation: row.start_location as string,
      endLocation: row.end_location as string,
      distance: row.distance as number,
      distanceUnit: row.distance_unit as MileageEntry['distanceUnit'],
      purpose: row.purpose as string,
      rateType: row.rate_type as MileageRateType,
      clientId: row.client_id as UUID | undefined,
      ratePerUnit: row.rate_per_unit as number,
      calculatedAmount: row.calculated_amount as number,
      vehicleDescription: row.vehicle_description as string | undefined,
      licensePlate: row.license_plate as string | undefined,
      routeNotes: row.route_notes as string | undefined,
      odometerStart: row.odometer_start as number | undefined,
      odometerEnd: row.odometer_end as number | undefined,
      status: row.status as MileageEntry['status'],
      submittedAt: row.submitted_at as string | undefined,
      approvedBy: row.approved_by as UUID | undefined,
      approvedAt: row.approved_at as string | undefined,
      rejectionReason: row.rejection_reason as string | undefined,
      paidAt: row.paid_at as string | undefined,
      paymentReference: row.payment_reference as string | undefined,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      notes: row.notes as string | undefined,
      tags: row.tags as string[] | undefined,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string | undefined,
      version: row.version as number,
    };
  }

  /**
   * Maps a MileageEntry entity to a database row
   */
  protected mapEntityToRow(entity: Partial<MileageEntry>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.employeeId !== undefined) row.employee_id = entity.employeeId;
    if (entity.tripDate !== undefined) row.trip_date = entity.tripDate;
    if (entity.startLocation !== undefined) row.start_location = entity.startLocation;
    if (entity.endLocation !== undefined) row.end_location = entity.endLocation;
    if (entity.distance !== undefined) row.distance = entity.distance;
    if (entity.distanceUnit !== undefined) row.distance_unit = entity.distanceUnit;
    if (entity.purpose !== undefined) row.purpose = entity.purpose;
    if (entity.rateType !== undefined) row.rate_type = entity.rateType;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.ratePerUnit !== undefined) row.rate_per_unit = entity.ratePerUnit;
    if (entity.calculatedAmount !== undefined) row.calculated_amount = entity.calculatedAmount;
    if (entity.vehicleDescription !== undefined) row.vehicle_description = entity.vehicleDescription;
    if (entity.licensePlate !== undefined) row.license_plate = entity.licensePlate;
    if (entity.routeNotes !== undefined) row.route_notes = entity.routeNotes;
    if (entity.odometerStart !== undefined) row.odometer_start = entity.odometerStart;
    if (entity.odometerEnd !== undefined) row.odometer_end = entity.odometerEnd;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.submittedAt !== undefined) row.submitted_at = entity.submittedAt;
    if (entity.approvedBy !== undefined) row.approved_by = entity.approvedBy;
    if (entity.approvedAt !== undefined) row.approved_at = entity.approvedAt;
    if (entity.rejectionReason !== undefined) row.rejection_reason = entity.rejectionReason;
    if (entity.paidAt !== undefined) row.paid_at = entity.paidAt;
    if (entity.paymentReference !== undefined) row.payment_reference = entity.paymentReference;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.tags !== undefined) row.tags = entity.tags;

    return row;
  }

  /**
   * Find mileage entries by employee ID
   */
  async findByEmployee(employeeId: UUID, context: UserContext): Promise<MileageEntry[]> {
    const query = `
      SELECT * FROM mileage_entries
      WHERE employee_id = $1
        AND organization_id = $2
      ORDER BY trip_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [employeeId, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find mileage entries by client ID
   */
  async findByClient(clientId: UUID, context: UserContext): Promise<MileageEntry[]> {
    const query = `
      SELECT * FROM mileage_entries
      WHERE client_id = $1
        AND organization_id = $2
      ORDER BY trip_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [clientId, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find mileage entries with advanced filtering
   */
  async findWithFilters(filter: MileageQueryFilter, context: UserContext): Promise<MileageEntry[]> {
    const conditions: string[] = ['organization_id = $1'];
    const parameters: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filter.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      parameters.push(filter.employeeId);
    }

    if (filter.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      parameters.push(filter.clientId);
    }

    if (filter.rateType) {
      conditions.push(`rate_type = $${paramIndex++}`);
      parameters.push(filter.rateType);
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      parameters.push(filter.status);
    }

    if (filter.startDate) {
      conditions.push(`trip_date >= $${paramIndex++}`);
      parameters.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`trip_date <= $${paramIndex++}`);
      parameters.push(filter.endDate);
    }

    if (filter.minDistance !== undefined) {
      conditions.push(`distance >= $${paramIndex++}`);
      parameters.push(filter.minDistance);
    }

    if (filter.maxDistance !== undefined) {
      conditions.push(`distance <= $${paramIndex++}`);
      parameters.push(filter.maxDistance);
    }

    if (filter.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      parameters.push(filter.branchId);
    }

    const query = `
      SELECT * FROM mileage_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY trip_date DESC, created_at DESC
    `;

    const result = await this.database.query(query, parameters);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Get mileage summary statistics
   */
  async getSummary(filter: MileageQueryFilter, context: UserContext): Promise<MileageSummary> {
    const conditions: string[] = ['organization_id = $1'];
    const parameters: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filter.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      parameters.push(filter.employeeId);
    }

    if (filter.startDate) {
      conditions.push(`trip_date >= $${paramIndex++}`);
      parameters.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`trip_date <= $${paramIndex++}`);
      parameters.push(filter.endDate);
    }

    if (filter.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      parameters.push(filter.branchId);
    }

    const query = `
      SELECT
        COUNT(*) as total_count,
        SUM(distance) as total_distance,
        SUM(calculated_amount) as total_amount,
        rate_type,
        status
      FROM mileage_entries
      WHERE ${conditions.join(' AND ')}
      GROUP BY rate_type, status
    `;

    const result = await this.database.query(query, parameters);

    const summary: MileageSummary = {
      totalDistance: 0,
      totalAmount: 0,
      totalCount: 0,
      byRateType: {} as MileageSummary['byRateType'],
      byStatus: {} as MileageSummary['byStatus'],
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
    };

    for (const row of result.rows) {
      const rateType = row.rate_type as MileageRateType;
      const status = row.status as string;
      const count = Number.parseInt(row.total_count as string, 10);
      const distance = Number.parseFloat(row.total_distance as string) || 0;
      const amount = Number.parseInt(row.total_amount as string, 10) || 0;

      if (!summary.byRateType[rateType]) {
        summary.byRateType[rateType] = { count: 0, distance: 0, amount: 0 };
      }

      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, distance: 0, amount: 0 };
      }

      summary.byRateType[rateType].count += count;
      summary.byRateType[rateType].distance += distance;
      summary.byRateType[rateType].amount += amount;
      summary.byStatus[status].count += count;
      summary.byStatus[status].distance += distance;
      summary.byStatus[status].amount += amount;
      summary.totalCount += count;
      summary.totalDistance += distance;
      summary.totalAmount += amount;

      if (status === 'SUBMITTED') {
        summary.pendingAmount += amount;
      } else if (status === 'APPROVED') {
        summary.approvedAmount += amount;
      } else if (status === 'PAID') {
        summary.paidAmount += amount;
      }
    }

    return summary;
  }
}

/**
 * Repository for managing mileage rates in the database
 */
export class MileageRateRepository extends Repository<MileageRate> {
  constructor(database: Database) {
    super({
      tableName: 'mileage_rates',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Maps a database row to a MileageRate entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): MileageRate {
    return {
      id: row.id as UUID,
      rateType: row.rate_type as MileageRateType,
      ratePerMile: row.rate_per_mile as number,
      ratePerKilometer: row.rate_per_kilometer as number,
      effectiveDate: row.effective_date as string,
      endDate: row.end_date as string | undefined,
      organizationId: row.organization_id as UUID,
      isDefault: row.is_default as boolean,
      description: row.description as string | undefined,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string | undefined,
      version: row.version as number,
    };
  }

  /**
   * Maps a MileageRate entity to a database row
   */
  protected mapEntityToRow(entity: Partial<MileageRate>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.rateType !== undefined) row.rate_type = entity.rateType;
    if (entity.ratePerMile !== undefined) row.rate_per_mile = entity.ratePerMile;
    if (entity.ratePerKilometer !== undefined) row.rate_per_kilometer = entity.ratePerKilometer;
    if (entity.effectiveDate !== undefined) row.effective_date = entity.effectiveDate;
    if (entity.endDate !== undefined) row.end_date = entity.endDate;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.isDefault !== undefined) row.is_default = entity.isDefault;
    if (entity.description !== undefined) row.description = entity.description;

    return row;
  }

  /**
   * Get the active rate for a given rate type and date
   */
  async getActiveRate(
    rateType: MileageRateType,
    date: string,
    context: UserContext
  ): Promise<MileageRate | null> {
    const query = `
      SELECT * FROM mileage_rates
      WHERE rate_type = $1
        AND organization_id = $2
        AND effective_date <= $3
        AND (end_date IS NULL OR end_date >= $3)
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    const result = await this.database.query(query, [rateType, context.organizationId, date]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Get all active rates for a given date
   */
  async getActiveRates(date: string, context: UserContext): Promise<MileageRate[]> {
    const query = `
      SELECT * FROM mileage_rates
      WHERE organization_id = $1
        AND effective_date <= $2
        AND (end_date IS NULL OR end_date >= $2)
      ORDER BY rate_type, effective_date DESC
    `;
    const result = await this.database.query(query, [context.organizationId, date]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }
}
