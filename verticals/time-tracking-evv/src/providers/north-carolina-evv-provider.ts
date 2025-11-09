import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';
import { ValidationResult } from '../aggregators/base-aggregator';

/**
 * North Carolina EVV Provider - Sandata Aggregator integration
 *
 * North Carolina Department of Health and Human Services (DHHS) requirements:
 * - Aggregator: Sandata
 * - Geofence radius: 1 mile (1609 meters)
 * - Visit tolerance: ±20 minutes (most lenient)
 * - Innovations waiver specific requirements
 * - Service definition code required
 *
 * SOLID: Interface Segregation - implements only NC-specific methods
 * APIE: Polymorphism - can be swapped with other state providers
 */
export interface INorthCarolinaEVVProvider {
  submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission>;
  validateVisit(evvRecord: EVVRecord): ValidationResult;
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean;
}

export class NorthCarolinaEVVProvider implements INorthCarolinaEVVProvider {
  constructor(private database: Database) {}

  /**
   * Submit to Sandata (North Carolina's designated aggregator)
   *
   * NC uses Sandata with DHHS-specific requirements and Innovations waiver support.
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission> {
    // Validate NC-specific requirements
    const config = await this.getNorthCarolinaEVVConfig(evvRecord.organizationId);

    if (!config) {
      throw new Error('NC EVV configuration not found for organization');
    }

    // Prepare payload per Sandata North Carolina specs
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

      // North Carolina-specific fields
      visitId: evvRecord.visitId,
      organizationId: evvRecord.organizationId,
      serviceDefCode: evvRecord.stateSpecificData?.['serviceDefCode'],
      program: config['medicaid_program'],
      innovationsWaiver: evvRecord.stateSpecificData?.['innovationsWaiver'] || false,
    };

    // Store submission record
    // EVVRecord extends Entity which has an id field
    const evvRecordWithId = evvRecord as EVVRecord & { id: UUID };
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'NC', $1, 'SANDATA', 'PRIMARY',
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
   * Validate visit against North Carolina-specific rules
   */
  validateVisit(evvRecord: EVVRecord): ValidationResult {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!evvRecord.clientMedicaidId) {
      errors.push({
        field: 'clientMedicaidId',
        code: 'NC_MISSING_MEDICAID_ID',
        message: 'North Carolina requires Medicaid ID for EVV submission',
        severity: 'ERROR' as const
      });
    }

    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'NC_MISSING_SERVICE_TYPE',
        message: 'Service type code is required',
        severity: 'ERROR' as const
      });
    }

    // Check for service definition code (NC requirement)
    if (!evvRecord.stateSpecificData?.['serviceDefCode']) {
      errors.push({
        field: 'serviceDefCode',
        code: 'NC_MISSING_SERVICE_DEF_CODE',
        message: 'North Carolina requires service definition code',
        severity: 'ERROR' as const
      });
    }

    // Check visit tolerance (±20 minutes - most lenient of all states)
    const scheduledStart = evvRecord.stateSpecificData?.['scheduledStartTime'] as Date | undefined;
    if (scheduledStart) {
      const actualStart = new Date(evvRecord.clockInTime);
      const diffMinutes = Math.abs((actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60));

      if (diffMinutes > 20) {
        warnings.push({
          field: 'clockInTime',
          code: 'NC_VISIT_TOLERANCE_EXCEEDED',
          message: `Clock-in is ${Math.round(diffMinutes)} minutes from scheduled time (tolerance: ±20 minutes)`,
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
   * Validate geofence with North Carolina's 1-mile radius requirement
   */
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean {
    const NC_GEOFENCE_RADIUS_METERS = 1609; // 1 mile

    if (!serviceAddress.latitude || !serviceAddress.longitude) {
      return false;
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceAddress.latitude,
      serviceAddress.longitude
    );

    return distance <= NC_GEOFENCE_RADIUS_METERS;
  }

  private async getNorthCarolinaEVVConfig(orgId: UUID) {
    const result = await this.database.query(`
      SELECT * FROM evv_state_config
      WHERE organization_id = $1 AND state_code = 'NC'
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
