/**
 * VMUR Service - Texas Visit Maintenance Unlock Request
 * 
 * Implements Texas HHSC's Visit Maintenance Unlock Request (VMUR) workflow
 * for correcting EVV data after the 30-day immutable period.
 * 
 * Per Texas HHSC EVV Policy:
 * - Records < 30 days old: Use standard revision workflow
 * - Records ≥ 30 days old: Require VMUR with supervisor approval
 * - VMUR must have valid reason code from HHSC-approved list
 * - All changes require detailed justification
 * - Aggregator must be notified of approved changes
 * 
 * References:
 * - 26 TAC §558 (Texas Administrative Code)
 * - HHSC EVV Policy Handbook
 */

import {
  UUID,
  UserContext,
  ValidationError,
  NotFoundError,
  PermissionError,
  Database,
} from '@care-commons/core';
import {
  TexasVMUR,
  TexasVMURReasonCode,
  TexasEVVDataSnapshot,
} from '../types/state-specific';

/**
 * VMUR creation input
 */
export interface CreateVMURInput {
  evvRecordId: UUID;
  visitId: UUID;
  requestReason: TexasVMURReasonCode;
  requestReasonDetails: string;
  correctedData: TexasEVVDataSnapshot;
  justification: string;
  supportingDocuments?: Array<{
    documentType: string;
    documentUrl: string;
    description: string;
  }>;
}

/**
 * VMUR approval input
 */
export interface ApproveVMURInput {
  vmurId: UUID;
  approvalNotes?: string;
}

/**
 * VMUR denial input
 */
export interface DenyVMURInput {
  vmurId: UUID;
  denialReason: string;
}

/**
 * Texas VMUR Service
 * 
 * Handles the complete VMUR workflow including:
 * - Creation with validation
 * - Supervisor approval/denial
 * - Aggregator notification
 * - Expiration tracking
 */
export class VMURService {
  constructor(private db: Database) {}

  /**
   * Create a new VMUR for a Texas EVV record
   * 
   * @throws ValidationError if record is < 30 days old (use standard revision)
   * @throws NotFoundError if EVV record doesn't exist
   * @throws ValidationError if record is not in Texas
   */
  async createVMUR(
    input: CreateVMURInput,
    context: UserContext
  ): Promise<TexasVMUR> {
    // 1. Validate EVV record exists and get organization
    const evvResult = await this.db.query(
      `SELECT 
        e.*,
        v.organization_id,
        v.branch_id,
        c.state as client_state
       FROM evv_records e
       INNER JOIN visits v ON e.visit_id = v.id
       INNER JOIN clients c ON e.client_id = c.id
       WHERE e.id = $1`,
      [input.evvRecordId]
    );

    if (evvResult.rows.length === 0) {
      throw new NotFoundError('EVV record not found', { evvRecordId: input.evvRecordId });
    }

    const evvRecord = evvResult.rows[0] as any;

    // 2. Validate record is for Texas
    if (evvRecord.client_state !== 'TX') {
      throw new ValidationError(
        'VMUR is only required for Texas EVV records. Other states use standard revision workflow.',
        { state: evvRecord.client_state }
      );
    }

    // 3. Check if record is older than 30 days (VMUR threshold)
    const recordAge = Date.now() - new Date(evvRecord['recorded_at']).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (recordAge < thirtyDays) {
      const daysOld = Math.floor(recordAge / (24 * 60 * 60 * 1000));
      throw new ValidationError(
        `VMUR only required for records older than 30 days. This record is ${daysOld} days old. ` +
        'Use standard revision workflow for records under 30 days.',
        { evvRecordId: input.evvRecordId, daysOld }
      );
    }

    // 4. Capture original data for audit trail
    const originalData: TexasEVVDataSnapshot = {
      clockInTime: new Date(evvRecord['clock_in_time']),
      clockOutTime: evvRecord['clock_out_time'] ? new Date(evvRecord['clock_out_time']) : undefined,
      clockInLatitude: evvRecord['clock_in_verification']?.['latitude'],
      clockInLongitude: evvRecord['clock_in_verification']?.['longitude'],
      clockOutLatitude: evvRecord['clock_out_verification']?.['latitude'],
      clockOutLongitude: evvRecord['clock_out_verification']?.['longitude'],
      clockMethod: this.mapClockMethodToTexas(evvRecord['clock_in_verification']?.['method']),
      totalDuration: evvRecord['total_duration'],
    };

    // 5. Calculate changes summary
    const changesSummary = this.calculateChangesSummary(originalData, input.correctedData);

    // 6. Validate reason code is valid for HHSC
    this.validateReasonCode(input.requestReason);

    // 7. VMUR expires in 30 days per HHSC policy
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 8. Create VMUR record
    const result = await this.db.query(
      `INSERT INTO texas_vmur (
        id,
        evv_record_id,
        visit_id,
        requested_by,
        requested_by_name,
        requested_at,
        request_reason,
        request_reason_details,
        approval_status,
        original_data,
        corrected_data,
        changes_summary,
        submitted_to_aggregator,
        expires_at,
        compliance_notes,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        NOW(),
        $5,
        $6,
        'PENDING',
        $7::jsonb,
        $8::jsonb,
        $9::jsonb,
        false,
        $10,
        $11,
        NOW(),
        NOW()
      ) RETURNING *`,
      [
        input.evvRecordId,
        input.visitId,
        context.userId,
        this.getUserName(context),
        input.requestReason,
        input.requestReasonDetails,
        JSON.stringify(originalData),
        JSON.stringify(input.correctedData),
        JSON.stringify(changesSummary),
        expiresAt,
        `VMUR created by ${this.getUserName(context)} for reason: ${input.requestReason}`,
      ]
    );

    const vmur = result.rows[0] as any;

    // 9. Return formatted VMUR
    return {
      id: vmur['id'],
      evvRecordId: vmur['evv_record_id'],
      visitId: vmur['visit_id'],
      requestedBy: vmur['requested_by'],
      requestedByName: vmur['requested_by_name'],
      requestedAt: new Date(vmur['requested_at']),
      requestReason: vmur['request_reason'],
      requestReasonDetails: vmur['request_reason_details'],
      approvalStatus: vmur['approval_status'],
      approvedBy: vmur['approved_by'] || undefined,
      approvedByName: vmur['approved_by_name'] || undefined,
      approvedAt: vmur['approved_at'] ? new Date(vmur['approved_at']) : undefined,
      denialReason: vmur['denial_reason'] || undefined,
      originalData: vmur['original_data'],
      correctedData: vmur['corrected_data'],
      changesSummary: vmur['changes_summary'],
      submittedToAggregator: vmur['submitted_to_aggregator'],
      aggregatorConfirmation: vmur['aggregator_confirmation'] || undefined,
      submittedAt: vmur['submitted_at'] ? new Date(vmur['submitted_at']) : undefined,
      expiresAt: new Date(vmur['expires_at']),
      complianceNotes: vmur['compliance_notes'] || undefined,
    };
  }

  /**
   * Approve VMUR (requires supervisor role)
   * 
   * @throws PermissionError if user is not supervisor
   * @throws NotFoundError if VMUR doesn't exist
   * @throws ValidationError if VMUR is not in PENDING status
   */
  async approveVMUR(
    input: ApproveVMURInput,
    context: UserContext
  ): Promise<TexasVMUR> {
    // 1. Verify requester has supervisor role
    if (!this.isSupervisor(context)) {
      throw new PermissionError(
        'VMUR approval requires supervisor role (COORDINATOR, BRANCH_ADMIN, ORG_ADMIN, or SUPER_ADMIN)',
        { userId: context.userId, roles: context.roles }
      );
    }

    // 2. Get VMUR and validate status
    const vmur = await this.getVMUR(input.vmurId);

    if (vmur.approvalStatus !== 'PENDING') {
      throw new ValidationError(
        `VMUR cannot be approved - current status is ${vmur.approvalStatus}`,
        { vmurId: input.vmurId, currentStatus: vmur.approvalStatus }
      );
    }

    // 3. Check if expired
    if (new Date() > vmur.expiresAt) {
      throw new ValidationError(
        'VMUR has expired. A new VMUR must be created.',
        { vmurId: input.vmurId, expiresAt: vmur.expiresAt }
      );
    }

    // 4. Update VMUR to approved
    await this.db.query(
      `UPDATE texas_vmur
       SET approval_status = 'APPROVED',
           approved_by = $1,
           approved_by_name = $2,
           approved_at = NOW(),
           compliance_notes = CASE
             WHEN compliance_notes IS NOT NULL THEN compliance_notes || ' | '
             ELSE ''
           END || $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        context.userId,
        this.getUserName(context),
        `Approved by ${this.getUserName(context)} on ${new Date().toISOString()}${input.approvalNotes ? ': ' + input.approvalNotes : ''}`,
        input.vmurId,
      ]
    );

    // 5. Apply corrections to EVV record
    await this.applyCorrections(vmur.evvRecordId, vmur.correctedData);

    // 6. Mark for aggregator resubmission
    // In production, trigger actual submission to HHAeXchange
    await this.db.query(
      `UPDATE texas_vmur
       SET submitted_to_aggregator = true,
           submitted_at = NOW()
       WHERE id = $1`,
      [input.vmurId]
    );

    return this.getVMUR(input.vmurId);
  }

  /**
   * Deny VMUR (requires supervisor role)
   */
  async denyVMUR(
    input: DenyVMURInput,
    context: UserContext
  ): Promise<TexasVMUR> {
    // 1. Verify requester has supervisor role
    if (!this.isSupervisor(context)) {
      throw new PermissionError(
        'VMUR denial requires supervisor role',
        { userId: context.userId, roles: context.roles }
      );
    }

    // 2. Get VMUR and validate status
    const vmur = await this.getVMUR(input.vmurId);

    if (vmur.approvalStatus !== 'PENDING') {
      throw new ValidationError(
        `VMUR cannot be denied - current status is ${vmur.approvalStatus}`,
        { vmurId: input.vmurId, currentStatus: vmur.approvalStatus }
      );
    }

    // 3. Update VMUR to denied
    await this.db.query(
      `UPDATE texas_vmur
       SET approval_status = 'DENIED',
           approved_by = $1,
           approved_by_name = $2,
           approved_at = NOW(),
           denial_reason = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        context.userId,
        this.getUserName(context),
        input.denialReason,
        input.vmurId,
      ]
    );

    return this.getVMUR(input.vmurId);
  }

  /**
   * Get VMUR by ID
   */
  async getVMUR(vmurId: UUID): Promise<TexasVMUR> {
    const result = await this.db.query(
      `SELECT * FROM texas_vmur WHERE id = $1`,
      [vmurId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('VMUR not found', { vmurId });
    }

    const vmur = result.rows[0] as any;

    return {
      id: vmur['id'],
      evvRecordId: vmur['evv_record_id'],
      visitId: vmur['visit_id'],
      requestedBy: vmur['requested_by'],
      requestedByName: vmur['requested_by_name'],
      requestedAt: new Date(vmur['requested_at']),
      requestReason: vmur['request_reason'],
      requestReasonDetails: vmur['request_reason_details'],
      approvalStatus: vmur['approval_status'],
      approvedBy: vmur['approved_by'] || undefined,
      approvedByName: vmur['approved_by_name'] || undefined,
      approvedAt: vmur['approved_at'] ? new Date(vmur['approved_at']) : undefined,
      denialReason: vmur['denial_reason'] || undefined,
      originalData: vmur['original_data'],
      correctedData: vmur['corrected_data'],
      changesSummary: vmur['changes_summary'],
      submittedToAggregator: vmur['submitted_to_aggregator'],
      aggregatorConfirmation: vmur['aggregator_confirmation'] || undefined,
      submittedAt: vmur['submitted_at'] ? new Date(vmur['submitted_at']) : undefined,
      expiresAt: new Date(vmur['expires_at']),
      complianceNotes: vmur['compliance_notes'] || undefined,
    };
  }

  /**
   * Get all pending VMURs for an organization
   */
  async getPendingVMURs(organizationId: UUID): Promise<TexasVMUR[]> {
    const result = await this.db.query(
      `SELECT v.*
       FROM texas_vmur v
       INNER JOIN visits vis ON v.visit_id = vis.id
       WHERE vis.organization_id = $1
         AND v.approval_status = 'PENDING'
         AND v.expires_at > NOW()
       ORDER BY v.requested_at ASC`,
      [organizationId]
    );

    return result.rows.map((row: any) => ({
      id: row['id'],
      evvRecordId: row['evv_record_id'],
      visitId: row['visit_id'],
      requestedBy: row['requested_by'],
      requestedByName: row['requested_by_name'],
      requestedAt: new Date(row['requested_at']),
      requestReason: row['request_reason'],
      requestReasonDetails: row['request_reason_details'],
      approvalStatus: row['approval_status'],
      approvedBy: row['approved_by'] || undefined,
      approvedByName: row['approved_by_name'] || undefined,
      approvedAt: row['approved_at'] ? new Date(row['approved_at']) : undefined,
      denialReason: row['denial_reason'] || undefined,
      originalData: row['original_data'],
      correctedData: row['corrected_data'],
      changesSummary: row['changes_summary'],
      submittedToAggregator: row['submitted_to_aggregator'],
      aggregatorConfirmation: row['aggregator_confirmation'] || undefined,
      submittedAt: row['submitted_at'] ? new Date(row['submitted_at']) : undefined,
      expiresAt: new Date(row['expires_at']),
      complianceNotes: row['compliance_notes'] || undefined,
    }));
  }

  /**
   * Expire VMURs that are past their expiration date
   */
  async expireOldVMURs(): Promise<number> {
    const result = await this.db.query(
      `UPDATE texas_vmur
       SET approval_status = 'EXPIRED',
           updated_at = NOW()
       WHERE approval_status = 'PENDING'
         AND expires_at < NOW()
       RETURNING id`
    );

    return result.rows.length;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate HHSC-approved reason code
   */
  private validateReasonCode(reasonCode: TexasVMURReasonCode): void {
    const validCodes: TexasVMURReasonCode[] = [
      'DEVICE_MALFUNCTION',
      'GPS_UNAVAILABLE',
      'NETWORK_OUTAGE',
      'APP_ERROR',
      'SYSTEM_DOWNTIME',
      'RURAL_POOR_SIGNAL',
      'SERVICE_LOCATION_CHANGE',
      'EMERGENCY_EVACUATION',
      'HOSPITAL_TRANSPORT',
      'FORGOT_TO_CLOCK',
      'TRAINING_NEW_STAFF',
      'INCORRECT_CLOCK_TIME',
      'DUPLICATE_ENTRY',
      'OTHER_APPROVED',
    ];

    if (!validCodes.includes(reasonCode)) {
      throw new ValidationError(
        `Invalid VMUR reason code: ${reasonCode}. Must be one of HHSC-approved codes.`,
        { reasonCode, validCodes }
      );
    }
  }

  /**
   * Calculate what changed between original and corrected data
   */
  private calculateChangesSummary(
    original: TexasEVVDataSnapshot,
    corrected: TexasEVVDataSnapshot
  ): string[] {
    const changes: string[] = [];

    if (original.clockInTime.getTime() !== corrected.clockInTime.getTime()) {
      changes.push(`Clock-in time changed from ${original.clockInTime.toISOString()} to ${corrected.clockInTime.toISOString()}`);
    }

    if (original.clockOutTime && corrected.clockOutTime && 
        original.clockOutTime.getTime() !== corrected.clockOutTime.getTime()) {
      changes.push(`Clock-out time changed from ${original.clockOutTime.toISOString()} to ${corrected.clockOutTime.toISOString()}`);
    }

    if (original.clockInLatitude !== corrected.clockInLatitude || 
        original.clockInLongitude !== corrected.clockInLongitude) {
      changes.push(`Clock-in location changed from (${original.clockInLatitude}, ${original.clockInLongitude}) to (${corrected.clockInLatitude}, ${corrected.clockInLongitude})`);
    }

    if (original.clockOutLatitude !== corrected.clockOutLatitude || 
        original.clockOutLongitude !== corrected.clockOutLongitude) {
      changes.push(`Clock-out location changed from (${original.clockOutLatitude}, ${original.clockOutLongitude}) to (${corrected.clockOutLatitude}, ${corrected.clockOutLongitude})`);
    }

    if (original.clockMethod !== corrected.clockMethod) {
      changes.push(`Clock method changed from ${original.clockMethod} to ${corrected.clockMethod}`);
    }

    if (original.totalDuration !== corrected.totalDuration) {
      changes.push(`Duration changed from ${original.totalDuration} minutes to ${corrected.totalDuration} minutes`);
    }

    return changes;
  }

  /**
   * Apply approved corrections to EVV record
   */
  private async applyCorrections(
    evvRecordId: UUID,
    correctedData: TexasEVVDataSnapshot
  ): Promise<void> {
    await this.db.query(
      `UPDATE evv_records
       SET clock_in_time = $1,
           clock_out_time = $2,
           total_duration = $3,
           clock_in_verification = jsonb_set(
             clock_in_verification,
             '{latitude}',
             to_jsonb($4::numeric)
           ),
           clock_in_verification = jsonb_set(
             clock_in_verification,
             '{longitude}',
             to_jsonb($5::numeric)
           ),
           updated_at = NOW()
       WHERE id = $6`,
      [
        correctedData.clockInTime,
        correctedData.clockOutTime || null,
        correctedData.totalDuration || null,
        correctedData.clockInLatitude,
        correctedData.clockInLongitude,
        evvRecordId,
      ]
    );
  }

  /**
   * Map generic clock method to Texas-specific enum
   */
  private mapClockMethodToTexas(method: string): 'MOBILE_GPS' | 'FIXED_TELEPHONY' | 'MOBILE_TELEPHONY' | 'FIXED_BIOMETRIC' | 'ALTERNATE_METHOD' {
    switch (method) {
      case 'GPS':
        return 'MOBILE_GPS';
      case 'PHONE':
        return 'MOBILE_TELEPHONY';
      case 'BIOMETRIC':
        return 'FIXED_BIOMETRIC';
      default:
        return 'ALTERNATE_METHOD';
    }
  }

  /**
   * Check if user has supervisor role
   */
  private isSupervisor(context: UserContext): boolean {
    return (
      context.roles.includes('SUPER_ADMIN') ||
      context.roles.includes('ORG_ADMIN') ||
      context.roles.includes('BRANCH_ADMIN') ||
      context.roles.includes('COORDINATOR')
    );
  }

  /**
   * Get user name from context
   */
  private getUserName(context: UserContext): string {
    // UserContext may have user details - in production, fetch from user service
    return context.userId;
  }
}
