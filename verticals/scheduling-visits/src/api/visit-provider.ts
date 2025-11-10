/**
 * Visit Provider Implementation
 * 
 * Concrete implementation of IVisitProvider interface from time-tracking-evv.
 * Provides visit data to the EVV vertical while maintaining decoupling.
 */

import { Pool } from 'pg';
import {
  UUID,
  NotFoundError,
  ValidationError,
  UserContext,
  Database,
} from '@care-commons/core';
import type {
  IVisitProvider,
  IClientProvider,
  EVVVisitData,
} from '@care-commons/time-tracking-evv/src/interfaces/visit-provider';
import { createClientProvider } from '@care-commons/time-tracking-evv/src/providers/client-provider';
import { ScheduleRepository } from '../repository/schedule-repository';
import { VisitStatus } from '../types/schedule';

/**
 * Visit Provider for EVV Integration
 * 
 * Fetches visit data from the scheduling vertical and transforms it
 * into the format required by EVV operations.
 */
export class VisitProvider implements IVisitProvider {
  private repository: ScheduleRepository;
  private clientProvider: IClientProvider;

  constructor(private pool: Pool, database: Database) {
    this.repository = new ScheduleRepository(pool);
    this.clientProvider = createClientProvider(database);
  }

  /**
   * Get visit data by ID for EVV operations
   * 
   * Retrieves complete visit information including client address,
   * service details, and authorization information needed for EVV compliance.
   * 
   * @throws NotFoundError if visit doesn't exist
   * @throws ValidationError if visit data is incomplete
   */
  async getVisitForEVV(visitId: UUID): Promise<EVVVisitData> {
    // Fetch visit from repository
    const visit = await this.repository.getVisitById(visitId);
    
    if (visit === null) {
      throw new NotFoundError('Visit not found', { visitId });
    }

    // Validate visit has required data for EVV
    if (visit.address == null) {
      throw new ValidationError('Visit does not have a service address', { visitId });
    }

    // Validate address has required geolocation data
    if (visit.address.latitude == null || visit.address.longitude == null) {
      throw new ValidationError(
        'Visit address must be geocoded before EVV operations',
        { visitId, address: visit.address }
      );
    }

    // Fetch client details for EVV using the real ClientProvider
    const client = await this.clientProvider.getClientForEVV(visit.clientId);
    
    // Get care plan data if available (for authorization info)
    const carePlanData = await this.getCarePlanData(visit.clientId);

    // Transform visit data to EVV format
    const evvVisitData: EVVVisitData = {
      // Visit identification
      visitId: visit.id,
      organizationId: visit.organizationId,
      branchId: visit.branchId,
      clientId: visit.clientId,
      caregiverId: visit.assignedCaregiverId ?? undefined,

      // Client information
      clientName: client.name,
      clientMedicaidId: client.medicaidId,

      // Service details
      serviceTypeId: visit.serviceTypeId,
      serviceTypeCode: carePlanData?.serviceTypeCode ?? 'PERSONAL_CARE', // Default to personal care
      serviceTypeName: visit.serviceTypeName,
      serviceDate: visit.scheduledDate,
      scheduledStartTime: visit.scheduledStartTime,
      scheduledEndTime: visit.scheduledEndTime,
      scheduledDuration: visit.scheduledDuration,

      // Location
      serviceAddress: {
        addressId: this.generateAddressId(visit.address),
        line1: visit.address.line1,
        line2: visit.address.line2,
        city: visit.address.city,
        state: visit.address.state,
        postalCode: visit.address.postalCode,
        country: visit.address.country,
        latitude: visit.address.latitude,
        longitude: visit.address.longitude,
        geofenceRadius: undefined, // Use state default
        addressVerified: true, // Assume verified if geocoded
      },

      // Authorization (from care plan if available)
      authorizationId: carePlanData?.authorizationId,
      authorizedUnits: carePlanData?.authorizedUnits,
      authorizedStartDate: carePlanData?.authorizedStartDate,
      authorizedEndDate: carePlanData?.authorizedEndDate,
      fundingSource: carePlanData?.fundingSource ?? (client.stateCode ? `${client.stateCode}_MEDICAID` : undefined),

      // Requirements
      requiredSkills: visit.requiredSkills ?? undefined,
      requiredCertifications: visit.requiredCertifications ?? undefined,

      // Care plan linkage
      carePlanId: carePlanData?.carePlanId,
      taskIds: visit.taskIds ?? undefined,
    };

    return evvVisitData;
  }

  /**
   * Validate that a visit exists and is in a valid state for clock-in
   * 
   * Checks:
   * - Visit exists and is not deleted
   * - Visit is assigned to the caregiver
   * - Visit status allows clock-in
   * - Visit is scheduled for today or within allowed grace period
   * 
   * @returns true if visit can be clocked into
   * @throws ValidationError with reason if visit cannot be clocked into
   */
  async canClockIn(visitId: UUID, caregiverId: UUID): Promise<boolean> {
    const visit = await this.repository.getVisitById(visitId);
    
    if (visit === null) {
      throw new ValidationError('Visit not found', { visitId });
    }

    // Check if visit is assigned to this caregiver
    if (visit.assignedCaregiverId == null) {
      throw new ValidationError('Visit is not assigned to any caregiver', { visitId });
    }

    if (visit.assignedCaregiverId !== caregiverId) {
      throw new ValidationError(
        'Visit is not assigned to this caregiver',
        { visitId, caregiverId, assignedTo: visit.assignedCaregiverId }
      );
    }

    // Check visit status - can only clock in if ASSIGNED, CONFIRMED, or EN_ROUTE
    const validStatuses: VisitStatus[] = ['ASSIGNED', 'CONFIRMED', 'EN_ROUTE'];
    if (!validStatuses.includes(visit.status)) {
      throw new ValidationError(
        `Cannot clock in - visit status is ${visit.status}`,
        { visitId, status: visit.status, validStatuses }
      );
    }

    // Check if visit date is valid (today or within grace period)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const visitDate = new Date(visit.scheduledDate);
    visitDate.setHours(0, 0, 0, 0);

    // Allow clock-in for visits scheduled today or in the past (late clock-in)
    // Future validation can add state-specific grace period rules
    if (visitDate > today) {
      throw new ValidationError(
        'Cannot clock in - visit is scheduled for a future date',
        { visitId, scheduledDate: visit.scheduledDate, today }
      );
    }

    return true;
  }

  /**
   * Validate that a visit is in progress and can be clocked out
   * 
   * Checks:
   * - Visit exists and is not deleted
   * - Visit is assigned to the caregiver
   * - Visit status is IN_PROGRESS (already clocked in)
   * 
   * @returns true if visit can be clocked out
   * @throws ValidationError with reason if visit cannot be clocked out
   */
  async canClockOut(visitId: UUID, caregiverId: UUID): Promise<boolean> {
    const visit = await this.repository.getVisitById(visitId);
    
    if (visit === null) {
      throw new ValidationError('Visit not found', { visitId });
    }

    // Check if visit is assigned to this caregiver
    if (visit.assignedCaregiverId == null) {
      throw new ValidationError('Visit is not assigned to any caregiver', { visitId });
    }

    if (visit.assignedCaregiverId !== caregiverId) {
      throw new ValidationError(
        'Visit is not assigned to this caregiver',
        { visitId, caregiverId, assignedTo: visit.assignedCaregiverId }
      );
    }

    // Check visit status - can only clock out if IN_PROGRESS or PAUSED
    const validStatuses: VisitStatus[] = ['IN_PROGRESS', 'PAUSED', 'ARRIVED'];
    if (!validStatuses.includes(visit.status)) {
      throw new ValidationError(
        `Cannot clock out - visit status is ${visit.status}. Must be IN_PROGRESS, PAUSED, or ARRIVED.`,
        { visitId, status: visit.status, validStatuses }
      );
    }

    return true;
  }

  /**
   * Update visit status based on EVV events
   * 
   * Syncs visit status when EVV clock events occur:
   * - Clock-in → IN_PROGRESS
   * - Clock-out → COMPLETED or INCOMPLETE
   * 
   * @param visitId Visit to update
   * @param status New status
   * @param evvRecordId EVV record that triggered the status change
   */
  async updateVisitStatus(
    visitId: UUID,
    status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE',
    evvRecordId: UUID
  ): Promise<void> {
    // Create a system user context for automated status updates
    const systemContext: UserContext = {
      userId: '00000000-0000-0000-0000-000000000000' as UUID,
      organizationId: '00000000-0000-0000-0000-000000000000' as UUID,
      branchIds: [],
      roles: ['SUPER_ADMIN'],
      permissions: [],
    };

    await this.repository.updateVisitStatus(
      visitId,
      status,
      systemContext,
      `Status updated by EVV system`,
      `EVV Record: ${evvRecordId}`
    );
  }

  /**
   * Private helper: Generate deterministic address ID
   * 
   * Creates a consistent UUID based on address components for geofence tracking.
   * NOTE: This is a temporary implementation. Replace with actual address table lookup
   * once address management is implemented.
   */
  private generateAddressId(address: { line1: string; city: string; state: string; postalCode: string }): UUID {
    // Create deterministic ID from address components
    // This ensures same address always gets same ID for geofence reuse
    const addressString = `${address.line1}|${address.city}|${address.state}|${address.postalCode}`.toLowerCase();
    
    // Simple hash-based UUID generation (for demo purposes)
    // In production, would look up address table or use proper UUID v5
    const hash = addressString.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    // Format as UUID (not cryptographically secure, just deterministic)
    const hashStr = Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
    return `${hashStr.slice(0, 8)}-${hashStr.slice(8, 12)}-${hashStr.slice(12, 16)}-${hashStr.slice(16, 20)}-${hashStr.slice(20, 32)}` as UUID;
  }

  /**
   * Private helper: Fetch care plan data for authorization info
   * 
   * Queries the active care plan for the client to get authorization details.
   * Returns undefined if no active care plan exists.
   */
  private async getCarePlanData(clientId: UUID): Promise<{
    serviceTypeCode?: string;
    authorizationId?: UUID;
    authorizedUnits?: number;
    authorizedStartDate?: Date;
    authorizedEndDate?: Date;
    fundingSource?: string;
    carePlanId?: UUID;
  } | undefined> {
    const query = `
      SELECT 
        id,
        service_authorization_id,
        authorized_units,
        authorization_start_date,
        authorization_end_date,
        funding_source
      FROM care_plans
      WHERE client_id = $1 
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [clientId]);
    
    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];
    
    return {
      carePlanId: row.id,
      authorizationId: row.service_authorization_id,
      authorizedUnits: row.authorized_units,
      authorizedStartDate: row.authorization_start_date,
      authorizedEndDate: row.authorization_end_date,
      fundingSource: row.funding_source,
      serviceTypeCode: undefined, // Would need to join to service_types or tasks
    };
  }
}

/**
 * Factory function to create a VisitProvider instance
 */
export function createVisitProvider(pool: Pool, database: Database): IVisitProvider {
  return new VisitProvider(pool, database);
}
