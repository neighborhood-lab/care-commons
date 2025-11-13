/**
 * Medication Repository - Data access layer for medications and administrations
 */

import { Repository, Database, UserContext } from '@care-commons/core';
import type {
  Medication,
  MedicationAdministration,
  MedicationStatus,
  MedicationWithStatus,
  RecordAdministrationInput,
} from '../types/medication.js';

export class MedicationRepository extends Repository<Medication> {
  constructor(database: Database) {
    super({
      tableName: 'medications',
      database,
      enableAudit: true,
      enableSoftDelete: false, // Medications are hard deleted or status changed to DISCONTINUED
    });
  }

  /**
   * Map database row to Medication entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Medication {
    const entity: Medication = {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      clientId: row['client_id'] as string,
      medicationName: row['medication_name'] as string,
      dosage: row['dosage'] as string,
      route: row['route'] as Medication['route'],
      frequency: row['frequency'] as string,
      prescribedBy: row['prescribed_by'] as string,
      prescribedDate: row['prescribed_date'] as Date,
      startDate: row['start_date'] as Date,
      status: row['status'] as MedicationStatus,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };

    // Handle optional properties
    if (row['generic_name'] !== null && row['generic_name'] !== undefined) {
      entity.genericName = row['generic_name'] as string;
    }
    if (row['instructions'] !== null && row['instructions'] !== undefined) {
      entity.instructions = row['instructions'] as string;
    }
    if (row['end_date'] !== null && row['end_date'] !== undefined) {
      entity.endDate = row['end_date'] as Date;
    }
    if (row['refills_remaining'] !== null && row['refills_remaining'] !== undefined) {
      entity.refillsRemaining = row['refills_remaining'] as number;
    }
    if (row['side_effects'] !== null && row['side_effects'] !== undefined) {
      entity.sideEffects = JSON.parse(row['side_effects'] as string) as string[];
    }
    if (row['warnings'] !== null && row['warnings'] !== undefined) {
      entity.warnings = JSON.parse(row['warnings'] as string) as string[];
    }

    return entity;
  }

  /**
   * Map Medication entity to database row
   */
  protected mapEntityToRow(entity: Partial<Medication>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.clientId !== undefined) row['client_id'] = entity.clientId;
    if (entity.medicationName !== undefined) row['medication_name'] = entity.medicationName;
    if (entity.genericName !== undefined) row['generic_name'] = entity.genericName;
    if (entity.dosage !== undefined) row['dosage'] = entity.dosage;
    if (entity.route !== undefined) row['route'] = entity.route;
    if (entity.frequency !== undefined) row['frequency'] = entity.frequency;
    if (entity.instructions !== undefined) row['instructions'] = entity.instructions;
    if (entity.prescribedBy !== undefined) row['prescribed_by'] = entity.prescribedBy;
    if (entity.prescribedDate !== undefined) row['prescribed_date'] = entity.prescribedDate;
    if (entity.startDate !== undefined) row['start_date'] = entity.startDate;
    if (entity.endDate !== undefined) row['end_date'] = entity.endDate;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.refillsRemaining !== undefined) row['refills_remaining'] = entity.refillsRemaining;
    if (entity.sideEffects !== undefined) row['side_effects'] = JSON.stringify(entity.sideEffects);
    if (entity.warnings !== undefined) row['warnings'] = JSON.stringify(entity.warnings);

    return row;
  }

  /**
   * Find all medications for a client
   */
  async findByClientId(
    clientId: string,
    context: UserContext,
    status?: MedicationStatus
  ): Promise<Medication[]> {
    const whereClause = this.enableSoftDelete
      ? 'WHERE client_id = $1 AND organization_id = $2 AND deleted_at IS NULL'
      : 'WHERE client_id = $1 AND organization_id = $2';

    let query = `SELECT * FROM ${this.tableName} ${whereClause}`;
    const params: unknown[] = [clientId, context.organizationId];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.database.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToEntity(row));
  }

  /**
   * Find all active medications for a client with last administration info
   */
  async findActiveWithStatus(
    clientId: string,
    context: UserContext
  ): Promise<MedicationWithStatus[]> {
    const whereClause = this.enableSoftDelete
      ? 'WHERE m.client_id = $1 AND m.organization_id = $2 AND m.status = $3 AND m.deleted_at IS NULL'
      : 'WHERE m.client_id = $1 AND m.organization_id = $2 AND m.status = $3';

    const query = `
      SELECT m.*,
        (
          SELECT administered_at
          FROM medication_administrations
          WHERE medication_id = m.id
            AND status = 'GIVEN'
          ORDER BY administered_at DESC
          LIMIT 1
        ) as last_administered
      FROM ${this.tableName} m
      ${whereClause}
      ORDER BY m.created_at DESC
    `;

    const result = await this.database.query(query, [clientId, context.organizationId, 'ACTIVE']);
    return result.rows.map((row: Record<string, unknown>) => {
      const medication = this.mapRowToEntity(row) as MedicationWithStatus;
      
      if (row['last_administered']) {
        medication.lastAdministered = row['last_administered'] as Date;
      }

      // Determine if refill is needed (less than 2 refills remaining)
      if (medication.refillsRemaining !== undefined) {
        medication.needsRefill = medication.refillsRemaining < 2;
      }

      return medication;
    });
  }
}

/**
 * Medication Administration Repository
 */
export class MedicationAdministrationRepository {
  private database: Database;
  private tableName = 'medication_administrations';

  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Map database row to MedicationAdministration entity
   */
  private mapRowToEntity(row: Record<string, unknown>): MedicationAdministration {
    const entity: MedicationAdministration = {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      medicationId: row['medication_id'] as string,
      clientId: row['client_id'] as string,
      administeredBy: row['administered_by'] as string,
      administeredAt: row['administered_at'] as Date,
      dosageGiven: row['dosage_given'] as string,
      route: row['route'] as MedicationAdministration['route'],
      status: row['status'] as MedicationAdministration['status'],
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };

    // Handle optional properties
    if (row['scheduled_for'] !== null && row['scheduled_for'] !== undefined) {
      entity.scheduledFor = row['scheduled_for'] as Date;
    }
    if (row['notes'] !== null && row['notes'] !== undefined) {
      entity.notes = row['notes'] as string;
    }
    if (row['refusal_reason'] !== null && row['refusal_reason'] !== undefined) {
      entity.refusalReason = row['refusal_reason'] as string;
    }
    if (row['hold_reason'] !== null && row['hold_reason'] !== undefined) {
      entity.holdReason = row['hold_reason'] as string;
    }
    if (row['witnessed_by'] !== null && row['witnessed_by'] !== undefined) {
      entity.witnessedBy = row['witnessed_by'] as string;
    }

    return entity;
  }

  /**
   * Record a medication administration
   */
  async create(
    input: RecordAdministrationInput,
    context: UserContext
  ): Promise<MedicationAdministration> {
    const now = new Date().toISOString();

    const row = {
      organization_id: context.organizationId,
      medication_id: input.medicationId,
      client_id: input.clientId,
      administered_by: context.userId,
      administered_at: input.administeredAt || now,
      scheduled_for: input.scheduledFor,
      dosage_given: input.dosageGiven,
      route: input.route,
      status: input.status,
      notes: input.notes,
      refusal_reason: input.refusalReason,
      hold_reason: input.holdReason,
      witnessed_by: input.witnessedBy,
    };

    const query = `
      INSERT INTO ${this.tableName} (
        organization_id, medication_id, client_id, administered_by,
        administered_at, scheduled_for, dosage_given, route, status,
        notes, refusal_reason, hold_reason, witnessed_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      row['organization_id'],
      row['medication_id'],
      row['client_id'],
      row['administered_by'],
      row['administered_at'],
      row['scheduled_for'],
      row['dosage_given'],
      row['route'],
      row['status'],
      row['notes'],
      row['refusal_reason'],
      row['hold_reason'],
      row['witnessed_by'],
    ];

    const result = await this.database.query(query, values);
    const createdRow = result.rows[0] as Record<string, unknown> | undefined;
    if (!createdRow) {
      throw new Error('Administration record creation failed');
    }
    return this.mapRowToEntity(createdRow);
  }

  /**
   * Find all administrations for a medication
   */
  async findByMedicationId(
    medicationId: string,
    context: UserContext,
    limit = 50
  ): Promise<MedicationAdministration[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE medication_id = $1 AND organization_id = $2
      ORDER BY administered_at DESC
      LIMIT $3
    `;

    const result = await this.database.query(query, [medicationId, context.organizationId, limit]);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToEntity(row));
  }

  /**
   * Find all administrations for a client within a date range
   */
  async findByClientIdAndDateRange(
    clientId: string,
    startDate: string,
    endDate: string,
    context: UserContext
  ): Promise<MedicationAdministration[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE client_id = $1 AND organization_id = $2
        AND administered_at BETWEEN $3 AND $4
      ORDER BY administered_at DESC
    `;

    const result = await this.database.query(query, [clientId, context.organizationId, startDate, endDate]);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToEntity(row));
  }

  /**
   * Get the last administration for a medication
   */
  async getLastAdministration(
    medicationId: string,
    context: UserContext
  ): Promise<MedicationAdministration | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE medication_id = $1 AND organization_id = $2 AND status = 'GIVEN'
      ORDER BY administered_at DESC
      LIMIT 1
    `;

    const result = await this.database.query(query, [medicationId, context.organizationId]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0] as Record<string, unknown>) : null;
  }
}
