/**
 * EVV Repository - Data access layer for time tracking and verification
 */

import { Database, UUID, PaginationParams, PaginatedResult } from '@care-commons/core';
import {
  EVVRecord,
  TimeEntry,
  Geofence,
  EVVRecordSearchFilters,
  EVVRecordStatus,
  VerificationLevel,
  PayorApprovalStatus,
  TimeEntryStatus,
} from '../types/evv';

interface EVVRecordRow {
  id: string;
  visit_id: string;
  organization_id: string;
  branch_id: string;
  client_id: string;
  caregiver_id: string;
  service_type_code: string;
  service_type_name: string;
  client_name: string;
  client_medicaid_id: string | null;
  caregiver_name: string;
  caregiver_employee_id: string;
  caregiver_npi: string | null;
  service_date: Date;
  service_address: string;
  clock_in_time: Date | null;
  clock_out_time: Date | null;
  total_duration: number | null;
  clock_in_verification: string;
  clock_out_verification: string | null;
  mid_visit_checks: string | null;
  pause_events: string | null;
  exception_events: string | null;
  record_status: string;
  verification_level: string;
  compliance_flags: string;
  integrity_hash: string;
  integrity_checksum: string;
  recorded_at: Date;
  recorded_by: string;
  sync_metadata: string;
  submitted_to_payor: Date | null;
  payor_approval_status: string | null;
  state_specific_data: string | null;
  caregiver_attestation: string | null;
  client_attestation: string | null;
  supervisor_review: string | null;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

interface TimeEntryRow {
  id: string;
  visit_id: string;
  evv_record_id: string | null;
  organization_id: string;
  caregiver_id: string;
  client_id: string;
  entry_type: string;
  entry_timestamp: Date;
  status: string;
  verification_passed: boolean;
  location: string;
  device_id: string;
  device_info: string;
  verification_method: string;
  location_source: string;
  location_accuracy: number | null;
  is_within_geofence: boolean;
  distance_from_address: number | null;
  integrity_hash: string;
  server_received_at: Date;
  sync_metadata: string;
  offline_recorded: boolean;
  offline_recorded_at: Date | null;
  verification_issues: string | null;
  manual_override: string | null;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

export class EVVRepository {
  constructor(private database: Database) {}

  /**
   * Create new EVV record
   */
  async createEVVRecord(
    record: Omit<EVVRecord, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<EVVRecord> {
    const query = `
      INSERT INTO evv_records (
        visit_id, organization_id, branch_id, client_id, caregiver_id,
        service_type_code, service_type_name,
        client_name, client_medicaid_id,
        caregiver_name, caregiver_employee_id, caregiver_npi,
        service_date, service_address,
        clock_in_time, clock_out_time, total_duration,
        clock_in_verification, clock_out_verification, mid_visit_checks,
        pause_events, exception_events,
        record_status, verification_level, compliance_flags,
        integrity_hash, integrity_checksum,
        recorded_at, recorded_by, sync_metadata,
        submitted_to_payor, payor_approval_status,
        state_specific_data,
        caregiver_attestation, client_attestation, supervisor_review,
        created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      record.visitId,
      record.organizationId,
      record.branchId,
      record.clientId,
      record.caregiverId,
      record.serviceTypeCode,
      record.serviceTypeName,
      record.clientName,
      record.clientMedicaidId,
      record.caregiverName,
      record.caregiverEmployeeId,
      record.caregiverNationalProviderId,
      record.serviceDate,
      JSON.stringify(record.serviceAddress),
      record.clockInTime,
      record.clockOutTime,
      record.totalDuration,
      JSON.stringify(record.clockInVerification),
      record.clockOutVerification ? JSON.stringify(record.clockOutVerification) : null,
      record.midVisitChecks ? JSON.stringify(record.midVisitChecks) : null,
      record.pauseEvents ? JSON.stringify(record.pauseEvents) : null,
      record.exceptionEvents ? JSON.stringify(record.exceptionEvents) : null,
      record.recordStatus,
      record.verificationLevel,
      JSON.stringify(record.complianceFlags),
      record.integrityHash,
      record.integrityChecksum,
      record.recordedAt,
      record.recordedBy,
      JSON.stringify(record.syncMetadata),
      record.submittedToPayor,
      record.payorApprovalStatus,
      record.stateSpecificData ? JSON.stringify(record.stateSpecificData) : null,
      record.caregiverAttestation ? JSON.stringify(record.caregiverAttestation) : null,
      record.clientAttestation ? JSON.stringify(record.clientAttestation) : null,
      record.supervisorReview ? JSON.stringify(record.supervisorReview) : null,
      record.createdBy,
      record.updatedBy,
    ]);

    return this.mapEVVRecord(result.rows[0] as unknown as EVVRecordRow);
  }

  /**
   * Get EVV record by ID
   */
  async getEVVRecordById(id: UUID): Promise<EVVRecord | null> {
    const query = 'SELECT * FROM evv_records WHERE id = $1';
    const result = await this.database.query(query, [id]);
    return result.rows[0] ? this.mapEVVRecord(result.rows[0] as unknown as EVVRecordRow) : null;
  }

  /**
   * Get EVV record by visit ID
   */
  async getEVVRecordByVisitId(visitId: UUID): Promise<EVVRecord | null> {
    const query = 'SELECT * FROM evv_records WHERE visit_id = $1';
    const result = await this.database.query(query, [visitId]);
    return result.rows[0] ? this.mapEVVRecord(result.rows[0] as unknown as EVVRecordRow) : null;
  }

  /**
   * Update EVV record
   */
  async updateEVVRecord(
    id: UUID,
    updates: Partial<EVVRecord>,
    updatedBy: UUID
  ): Promise<EVVRecord> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        const dbKey = this.camelToSnake(key);

        // Handle JSON fields
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    fields.push(`updated_at = NOW()`);
    fields.push(`updated_by = $${paramIndex}`);
    values.push(updatedBy);
    paramIndex++;

    fields.push(`version = version + 1`);
    values.push(id);

    const query = `
      UPDATE evv_records
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    if (!result.rows[0]) {
      throw new Error(`EVV record ${id} not found`);
    }

    return this.mapEVVRecord(result.rows[0] as unknown as EVVRecordRow);
  }

  /**
   * Search EVV records
   */
  async searchEVVRecords(
    filters: EVVRecordSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<EVVRecord>> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(filters.organizationId);
      paramIndex++;
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex}`);
      values.push(filters.branchId);
      paramIndex++;
    }

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex}`);
      values.push(filters.clientId);
      paramIndex++;
    }

    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex}`);
      values.push(filters.caregiverId);
      paramIndex++;
    }

    if (filters.visitId) {
      conditions.push(`visit_id = $${paramIndex}`);
      values.push(filters.visitId);
      paramIndex++;
    }

    if (filters.startDate) {
      conditions.push(`service_date >= $${paramIndex}`);
      values.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      conditions.push(`service_date <= $${paramIndex}`);
      values.push(filters.endDate);
      paramIndex++;
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`record_status = ANY($${paramIndex})`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.verificationLevel && filters.verificationLevel.length > 0) {
      conditions.push(`verification_level = ANY($${paramIndex})`);
      values.push(filters.verificationLevel);
      paramIndex++;
    }

    if (filters.hasComplianceFlags) {
      conditions.push(`jsonb_array_length(compliance_flags) > 0`);
    }

    if (filters.complianceFlags && filters.complianceFlags.length > 0) {
      conditions.push(`compliance_flags ?| $${paramIndex}`);
      values.push(filters.complianceFlags);
      paramIndex++;
    }

    if (filters.submittedToPayor !== undefined) {
      if (filters.submittedToPayor) {
        conditions.push(`submitted_to_payor IS NOT NULL`);
      } else {
        conditions.push(`submitted_to_payor IS NULL`);
      }
    }

    if (filters.payorApprovalStatus && filters.payorApprovalStatus.length > 0) {
      conditions.push(`payor_approval_status = ANY($${paramIndex})`);
      values.push(filters.payorApprovalStatus);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM evv_records ${whereClause}`;
    const countResult = await this.database.query(countQuery, values);
    const total = parseInt(countResult.rows[0]!['count'] as string);

    // Get paginated results with whitelisted sort parameters to prevent SQL injection
    const allowedSortFields = [
      'serviceDate',
      'createdAt',
      'updatedAt',
      'clockInTime',
      'clockOutTime',
      'recordStatus',
      'verificationLevel',
    ];
    const sortByRaw = pagination.sortBy || 'serviceDate';
    const sortBy = allowedSortFields.includes(sortByRaw)
      ? this.camelToSnake(sortByRaw)
      : 'service_date';

    const sortOrderRaw = pagination.sortOrder?.toLowerCase();
    const sortOrder =
      sortOrderRaw === 'asc' || sortOrderRaw === 'desc' ? sortOrderRaw.toUpperCase() : 'DESC';
    const offset = (pagination.page - 1) * pagination.limit;

    // Use completely whitelisted ORDER BY clauses to prevent any SQL injection
    const allowedOrderClauses = [
      'service_date ASC',
      'service_date DESC',
      'created_at ASC',
      'created_at DESC',
      'updated_at ASC',
      'updated_at DESC',
      'clock_in_time ASC',
      'clock_in_time DESC',
      'clock_out_time ASC',
      'clock_out_time DESC',
      'record_status ASC',
      'record_status DESC',
      'verification_level ASC',
      'verification_level DESC',
    ];

    const orderClause = `${sortBy} ${sortOrder}`;
    const finalOrderClause = allowedOrderClauses.includes(orderClause)
      ? orderClause
      : 'service_date DESC';

    values.push(pagination.limit, offset);

    // Use parameterized query with completely safe ORDER BY clause
    const dataQuery = `
      SELECT * FROM evv_records
      ${whereClause}
      ORDER BY ${finalOrderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.database.query(dataQuery, values);

    return {
      items: result.rows.map((row) => this.mapEVVRecord(row as unknown as EVVRecordRow)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Create time entry
   */
  async createTimeEntry(
    entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<TimeEntry> {
    const query = `
      INSERT INTO time_entries (
        visit_id, evv_record_id, organization_id, caregiver_id, client_id,
        entry_type, entry_timestamp,
        location, device_id, device_info,
        integrity_hash, server_received_at,
        sync_metadata, offline_recorded, offline_recorded_at,
        status, verification_passed, verification_issues, manual_override,
        created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      entry.visitId,
      entry.evvRecordId,
      entry.organizationId,
      entry.caregiverId,
      entry.clientId,
      entry.entryType,
      entry.entryTimestamp,
      JSON.stringify(entry.location),
      entry.deviceId,
      JSON.stringify(entry.deviceInfo),
      entry.integrityHash,
      entry.serverReceivedAt,
      JSON.stringify(entry.syncMetadata),
      entry.offlineRecorded,
      entry.offlineRecordedAt,
      entry.status,
      entry.verificationPassed,
      entry.verificationIssues ? JSON.stringify(entry.verificationIssues) : null,
      entry.manualOverride ? JSON.stringify(entry.manualOverride) : null,
      entry.createdBy,
      entry.updatedBy,
    ]);

    return this.mapTimeEntry(result.rows[0] as unknown as TimeEntryRow);
  }

  /**
   * Get time entries for visit
   */
  async getTimeEntriesByVisitId(visitId: UUID): Promise<TimeEntry[]> {
    const query = `
      SELECT * FROM time_entries
      WHERE visit_id = $1
      ORDER BY entry_timestamp ASC
    `;
    const result = await this.database.query(query, [visitId]);
    return result.rows.map((row) => this.mapTimeEntry(row as unknown as TimeEntryRow));
  }

  /**
   * Get pending time entries (for sync)
   */
  async getPendingTimeEntries(organizationId: UUID, limit: number = 100): Promise<TimeEntry[]> {
    const query = `
      SELECT * FROM time_entries
      WHERE organization_id = $1
        AND status = 'PENDING'
      ORDER BY entry_timestamp ASC
      LIMIT $2
    `;
    const result = await this.database.query(query, [organizationId, limit]);
    return result.rows.map((row) => this.mapTimeEntry(row as unknown as TimeEntryRow));
  }

  /**
   * Get time entry by ID
   */
  async getTimeEntryById(id: UUID): Promise<TimeEntry | null> {
    const query = 'SELECT * FROM time_entries WHERE id = $1';
    const result = await this.database.query(query, [id]);
    return result.rows[0] ? this.mapTimeEntry(result.rows[0] as unknown as TimeEntryRow) : null;
  }

  /**
   * Update time entry
   */
  async updateTimeEntry(
    id: UUID,
    updates: Partial<TimeEntry>,
    updatedBy: UUID
  ): Promise<TimeEntry> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'createdBy' && key !== 'version') {
        const dbKey = this.camelToSnake(key);

        // Handle JSON fields
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    fields.push(`updated_at = NOW()`);
    fields.push(`updated_by = $${paramIndex}`);
    values.push(updatedBy);
    paramIndex++;

    fields.push(`version = version + 1`);
    values.push(id);

    const query = `
      UPDATE time_entries
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    if (!result.rows[0]) {
      throw new Error(`Time entry ${id} not found`);
    }

    return this.mapTimeEntry(result.rows[0] as unknown as TimeEntryRow);
  }

  /**
   * Update time entry status
   */
  async updateTimeEntryStatus(
    id: UUID,
    status: string,
    verificationPassed: boolean,
    issues?: string[],
    updatedBy?: UUID
  ): Promise<TimeEntry> {
    const query = `
      UPDATE time_entries
      SET status = $1,
          verification_passed = $2,
          verification_issues = $3,
          updated_at = NOW(),
          updated_by = $4,
          version = version + 1
      WHERE id = $5
      RETURNING *
    `;

    const result = await this.database.query(query, [
      status,
      verificationPassed,
      issues ? JSON.stringify(issues) : null,
      updatedBy,
      id,
    ]);

    if (!result.rows[0]) {
      throw new Error(`Time entry ${id} not found`);
    }

    return this.mapTimeEntry(result.rows[0] as unknown as TimeEntryRow);
  }

  /**
   * Create or update geofence
   */
  async createGeofence(
    geofence: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Geofence> {
    const query = `
      INSERT INTO geofences (
        organization_id, client_id, address_id,
        center_latitude, center_longitude,
        radius_meters, radius_type, shape, polygon_points,
        is_active, allowed_variance,
        calibrated_at, calibrated_by, calibration_method, calibration_notes,
        verification_count, successful_verifications, failed_verifications, average_accuracy,
        status, created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      geofence.organizationId,
      geofence.clientId,
      geofence.addressId,
      geofence.centerLatitude,
      geofence.centerLongitude,
      geofence.radiusMeters,
      geofence.radiusType,
      geofence.shape,
      geofence.polygonPoints ? JSON.stringify(geofence.polygonPoints) : null,
      geofence.isActive,
      geofence.allowedVariance,
      geofence.calibratedAt,
      geofence.calibratedBy,
      geofence.calibrationMethod,
      geofence.calibrationNotes,
      geofence.verificationCount,
      geofence.successfulVerifications,
      geofence.failedVerifications,
      geofence.averageAccuracy,
      geofence.status,
      geofence.createdBy,
      geofence.updatedBy,
    ]);

    return this.mapGeofence(result.rows[0]);
  }

  /**
   * Get geofence for client address
   */
  async getGeofenceByAddress(addressId: UUID): Promise<Geofence | null> {
    const query = `
      SELECT * FROM geofences
      WHERE address_id = $1 AND is_active = true AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.database.query(query, [addressId]);
    return result.rows[0] ? this.mapGeofence(result.rows[0]) : null;
  }

  /**
   * Update geofence statistics
   */
  async updateGeofenceStats(id: UUID, successful: boolean, accuracy: number): Promise<void> {
    const query = `
      UPDATE geofences
      SET verification_count = verification_count + 1,
          successful_verifications = successful_verifications + $1,
          failed_verifications = failed_verifications + $2,
          average_accuracy = (
            (COALESCE(average_accuracy, 0) * verification_count + $3) / 
            (verification_count + 1)
          ),
          updated_at = NOW()
      WHERE id = $4
    `;

    await this.database.query(query, [successful ? 1 : 0, successful ? 0 : 1, accuracy, id]);
  }

  /**
   * Helper: Map database row to EVVRecord
   */
  private mapEVVRecord(row: EVVRecordRow): EVVRecord {
    const baseRecord = {
      id: row.id,
      visitId: row.visit_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      serviceTypeCode: row.service_type_code,
      serviceTypeName: row.service_type_name,
      clientName: row.client_name,
      caregiverName: row.caregiver_name,
      caregiverEmployeeId: row.caregiver_employee_id,
      serviceDate: row.service_date,
      serviceAddress: JSON.parse(row.service_address),
      clockInTime: row.clock_in_time!,
      clockInVerification: JSON.parse(row.clock_in_verification),
      recordStatus: row.record_status as EVVRecordStatus,
      verificationLevel: row.verification_level as VerificationLevel,
      complianceFlags: JSON.parse(row.compliance_flags),
      integrityHash: row.integrity_hash,
      integrityChecksum: row.integrity_checksum,
      recordedAt: row.recorded_at,
      recordedBy: row.recorded_by,
      syncMetadata: JSON.parse(row.sync_metadata),
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };

    const optionalFields = {
      clientMedicaidId: row.client_medicaid_id,
      caregiverNationalProviderId: row.caregiver_npi,
      clockOutTime: row.clock_out_time,
      totalDuration: row.total_duration,
      clockOutVerification: row.clock_out_verification
        ? JSON.parse(row.clock_out_verification)
        : undefined,
      midVisitChecks: row.mid_visit_checks ? JSON.parse(row.mid_visit_checks) : undefined,
      pauseEvents: row.pause_events ? JSON.parse(row.pause_events) : undefined,
      exceptionEvents: row.exception_events ? JSON.parse(row.exception_events) : undefined,
      submittedToPayor: row.submitted_to_payor,
      payorApprovalStatus: row.payor_approval_status as PayorApprovalStatus,
      stateSpecificData: row.state_specific_data ? JSON.parse(row.state_specific_data) : undefined,
      caregiverAttestation: row.caregiver_attestation
        ? JSON.parse(row.caregiver_attestation)
        : undefined,
      clientAttestation: row.client_attestation ? JSON.parse(row.client_attestation) : undefined,
      supervisorReview: row.supervisor_review ? JSON.parse(row.supervisor_review) : undefined,
    };

    const filteredOptional = Object.fromEntries(
      Object.entries(optionalFields).filter(([_, value]) => value !== undefined && value !== null)
    );

    return { ...baseRecord, ...filteredOptional } as EVVRecord;
  }

  /**
   * Helper: Map database row to Geofence
   */
  private mapGeofence(row: any): Geofence {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      addressId: row.address_id,
      centerLatitude: row.center_latitude,
      centerLongitude: row.center_longitude,
      radiusMeters: row.radius_meters,
      radiusType: row.radius_type,
      shape: row.shape,
      polygonPoints: row.polygon_points ? JSON.parse(row.polygon_points) : undefined,
      isActive: row.is_active,
      allowedVariance: row.allowed_variance,
      calibratedAt: row.calibrated_at,
      calibratedBy: row.calibrated_by,
      calibrationMethod: row.calibration_method,
      calibrationNotes: row.calibration_notes,
      verificationCount: row.verification_count,
      successfulVerifications: row.successful_verifications,
      failedVerifications: row.failed_verifications,
      averageAccuracy: row.average_accuracy,
      status: row.status,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  /**
   * Helper: Map database row to TimeEntry
   */
  private mapTimeEntry(row: TimeEntryRow): TimeEntry {
    const baseEntry = {
      id: row.id,
      visitId: row.visit_id,
      organizationId: row.organization_id,
      caregiverId: row.caregiver_id,
      clientId: row.client_id,

      // Entry details
      entryType: row.entry_type as TimeEntry['entryType'],
      entryTimestamp: row.entry_timestamp,
      location: JSON.parse(row.location),
      deviceId: row.device_id,
      deviceInfo: JSON.parse(row.device_info),
      integrityHash: row.integrity_hash,
      serverReceivedAt: row.server_received_at,
      syncMetadata: JSON.parse(row.sync_metadata),
      offlineRecorded: row.offline_recorded,

      // Status
      status: row.status as TimeEntryStatus,
      verificationPassed: row.verification_passed,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };

    const optionalFields = {
      evvRecordId: row.evv_record_id,
      offlineRecordedAt: row.offline_recorded_at,
      verificationIssues: row.verification_issues ? JSON.parse(row.verification_issues) : undefined,
      manualOverride: row.manual_override ? JSON.parse(row.manual_override) : undefined,
    };

    const filteredOptional = Object.fromEntries(
      Object.entries(optionalFields).filter(([_, value]) => value !== undefined && value !== null)
    );

    return { ...baseEntry, ...filteredOptional } as TimeEntry;
  }

  /**
   * Helper: Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
