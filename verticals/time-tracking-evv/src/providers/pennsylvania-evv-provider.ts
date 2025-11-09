import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';
import { ValidationResult } from '../aggregators/base-aggregator';

/**
 * Pennsylvania EVV Provider - Sandata Aggregator integration
 *
 * Pennsylvania Department of Human Services (DHS) requirements:
 * - Aggregator: Sandata
 * - Geofence radius: 0.5 mile (804 meters) - STRICTER than other states
 * - Visit tolerance: ±10 minutes - STRICTER than other states
 * - Requires prior authorization verification
 * - 7-year retention requirement (longest of all states)
 *
 * SOLID: Interface Segregation - implements only PA-specific methods
 * APIE: Polymorphism - can be swapped with other state providers
 */
export interface IPennsylvaniaEVVProvider {
  submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission>;
  validateVisit(evvRecord: EVVRecord): ValidationResult;
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean;
  verifyPriorAuthorization(clientId: UUID, serviceTypeCode: string): Promise<boolean>;
}

export class PennsylvaniaEVVProvider implements IPennsylvaniaEVVProvider {
  constructor(private database: Database) {}

  /**
   * Submit to Sandata (Pennsylvania's designated aggregator)
   *
   * PA uses Sandata with stricter requirements than other states.
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission> {
    // Validate PA-specific requirements
    const config = await this.getPennsylvaniaEVVConfig(evvRecord.organizationId);

    if (!config) {
      throw new Error('PA EVV configuration not found for organization');
    }

    // Verify prior authorization
    const authValid = await this.verifyPriorAuthorization(
      evvRecord.clientId,
      evvRecord.serviceTypeCode
    );

    if (!authValid) {
      throw new Error('PA requires valid prior authorization for EVV submission');
    }

    // Prepare payload per Sandata Pennsylvania specs
    const payload = {
      // Federal EVV elements
      serviceType: evvRecord.serviceTypeCode,
      memberIdentifier: evvRecord.clientMedicaidId,
      providerIdentifier: evvRecord.caregiverEmployeeId,
      serviceDate: evvRecord.serviceDate,
      serviceStartTime: evvRecord.clockInTime,
      serviceEndTime: evvRecord.clockOutTime,
      serviceLocation: {
        latitude: evvRecord.clockInVerification.latitude,
        longitude: evvRecord.clockInVerification.longitude,
        accuracy: evvRecord.clockInVerification.accuracy
      },

      // Pennsylvania-specific fields
      visitId: evvRecord.visitId,
      organizationId: evvRecord.organizationId,
      authorizationNumber: evvRecord.stateSpecificData?.['authNumber'],
      program: config['medicaid_program'],
      dhsRegion: evvRecord.stateSpecificData?.['dhsRegion'],
    };

    // Store submission record
    // EVVRecord extends Entity which has an id field
    const evvRecordWithId = evvRecord as EVVRecord & { id: UUID };
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'PA', $1, 'SANDATA', 'PRIMARY',
        $2::jsonb, 'JSON', $3, 'PENDING'
      ) RETURNING id
    `, [evvRecordWithId.id, JSON.stringify(payload), evvRecord.recordedBy]);

    return {
      submissionId: submissionId.rows[0]!['id'] as UUID,
      status: 'PENDING',
      aggregator: 'SANDATA',
      submittedAt: new Date()
    };
  }

  /**
   * Validate visit against Pennsylvania-specific rules
   */
  validateVisit(evvRecord: EVVRecord): ValidationResult {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!evvRecord.clientMedicaidId) {
      errors.push({
        field: 'clientMedicaidId',
        code: 'PA_MISSING_MEDICAID_ID',
        message: 'Pennsylvania requires Medicaid ID for EVV submission',
        severity: 'ERROR' as const
      });
    }

    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'PA_MISSING_SERVICE_TYPE',
        message: 'Service type code is required',
        severity: 'ERROR' as const
      });
    }

    // Check for authorization number
    if (!evvRecord.stateSpecificData?.['authNumber']) {
      errors.push({
        field: 'authNumber',
        code: 'PA_MISSING_AUTH_NUMBER',
        message: 'Pennsylvania requires prior authorization number',
        severity: 'ERROR' as const
      });
    }

    // Check visit tolerance (±10 minutes - STRICTER than other states)
    const scheduledStart = evvRecord.stateSpecificData?.['scheduledStartTime'] as Date | undefined;
    if (scheduledStart) {
      const actualStart = new Date(evvRecord.clockInTime);
      const diffMinutes = Math.abs((actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60));

      if (diffMinutes > 10) {
        warnings.push({
          field: 'clockInTime',
          code: 'PA_VISIT_TOLERANCE_EXCEEDED',
          message: `Clock-in is ${Math.round(diffMinutes)} minutes from scheduled time (tolerance: ±10 minutes)`,
          severity: 'WARNING' as const
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate geofence with Pennsylvania's STRICT 0.5-mile radius requirement
   */
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean {
    const PA_GEOFENCE_RADIUS_METERS = 804; // 0.5 mile - STRICTER than other states

    if (!serviceAddress.latitude || !serviceAddress.longitude) {
      return false;
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceAddress.latitude,
      serviceAddress.longitude
    );

    return distance <= PA_GEOFENCE_RADIUS_METERS;
  }

  /**
   * Verify prior authorization for service
   *
   * Pennsylvania requires prior authorization verification before EVV submission.
   * This checks the authorization database to ensure the service is authorized.
   */
  async verifyPriorAuthorization(clientId: UUID, serviceTypeCode: string): Promise<boolean> {
    const result = await this.database.query(`
      SELECT id, status, end_date
      FROM service_authorizations
      WHERE client_id = $1
        AND service_type_code = $2
        AND status = 'ACTIVE'
        AND start_date <= CURRENT_DATE
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      LIMIT 1
    `, [clientId, serviceTypeCode]);

    return result.rows.length > 0;
  }

  private async getPennsylvaniaEVVConfig(orgId: UUID) {
    const result = await this.database.query(`
      SELECT * FROM evv_state_config
      WHERE organization_id = $1 AND state_code = 'PA'
    `, [orgId]);
    return result.rows[0];
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

interface AggregatorSubmission {
  submissionId: UUID;
  status: string;
  aggregator: string;
  submittedAt: Date;
}

interface ServiceAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}
