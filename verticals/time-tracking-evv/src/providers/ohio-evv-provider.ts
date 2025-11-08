import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';
import { ValidationResult } from '../aggregators/base-aggregator';

/**
 * Ohio EVV Provider - Sandata Aggregator integration
 *
 * Ohio Department of Medicaid (ODM) requirements:
 * - Aggregator: Sandata
 * - Geofence radius: 1 mile (1609 meters)
 * - Visit tolerance: ±15 minutes
 * - Service types: Home health vs. waiver services have different rules
 *
 * SOLID: Interface Segregation - implements only OH-specific methods
 * APIE: Polymorphism - can be swapped with other state providers
 */
export interface IOhioEVVProvider {
  submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission>;
  validateVisit(evvRecord: EVVRecord): ValidationResult;
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean;
  determineServiceCategory(serviceTypeCode: string): 'HOME_HEALTH' | 'WAIVER';
}

export class OhioEVVProvider implements IOhioEVVProvider {
  constructor(private database: Database) {}

  /**
   * Submit to Sandata (Ohio's designated aggregator)
   *
   * Ohio uses Sandata for EVV aggregation with ODM-specific requirements.
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission> {
    // Validate OH-specific requirements
    const config = await this.getOhioEVVConfig(evvRecord.organizationId);

    if (!config) {
      throw new Error('OH EVV configuration not found for organization');
    }

    // Determine service category (home health vs waiver)
    const serviceCategory = this.determineServiceCategory(evvRecord.serviceTypeCode);

    // Prepare payload per Sandata Ohio specs
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

      // Ohio-specific fields
      visitId: evvRecord.visitId,
      organizationId: evvRecord.organizationId,
      odmServiceCategory: serviceCategory,
      program: config['medicaid_program'],
    };

    // Store submission record
    // EVVRecord extends Entity which has an id field
    const evvRecordWithId = evvRecord as EVVRecord & { id: UUID };
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'OH', $1, 'SANDATA', 'PRIMARY',
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
   * Validate visit against Ohio-specific rules
   */
  validateVisit(evvRecord: EVVRecord): ValidationResult {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!evvRecord.clientMedicaidId) {
      errors.push({
        field: 'clientMedicaidId',
        code: 'OH_MISSING_MEDICAID_ID',
        message: 'Ohio requires Medicaid ID for EVV submission',
        severity: 'ERROR' as const
      });
    }

    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'OH_MISSING_SERVICE_TYPE',
        message: 'Service type code is required',
        severity: 'ERROR' as const
      });
    }

    // Check visit tolerance (±15 minutes)
    const scheduledStart = evvRecord.stateSpecificData?.['scheduledStartTime'] as Date | undefined;
    if (scheduledStart) {
      const actualStart = new Date(evvRecord.clockInTime);
      const diffMinutes = Math.abs((actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60));

      if (diffMinutes > 15) {
        warnings.push({
          field: 'clockInTime',
          code: 'OH_VISIT_TOLERANCE_EXCEEDED',
          message: `Clock-in is ${Math.round(diffMinutes)} minutes from scheduled time (tolerance: ±15 minutes)`,
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
   * Validate geofence with Ohio's 1-mile radius requirement
   */
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean {
    const OHIO_GEOFENCE_RADIUS_METERS = 1609; // 1 mile

    if (!serviceAddress.latitude || !serviceAddress.longitude) {
      return false;
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceAddress.latitude,
      serviceAddress.longitude
    );

    return distance <= OHIO_GEOFENCE_RADIUS_METERS;
  }

  /**
   * Determine if service is home health or waiver
   *
   * Ohio has different rules for:
   * - Home health services (medical focus)
   * - Waiver services (long-term care, HCBS)
   */
  determineServiceCategory(serviceTypeCode: string): 'HOME_HEALTH' | 'WAIVER' {
    const homeHealthCodes = ['SN', 'PT', 'OT', 'ST', 'MSW', 'HHA'];
    const waiverCodes = ['PCA', 'RESPITE', 'ADT', 'PERS', 'HOME_MOD'];

    if (homeHealthCodes.includes(serviceTypeCode)) {
      return 'HOME_HEALTH';
    }
    if (waiverCodes.includes(serviceTypeCode)) {
      return 'WAIVER';
    }

    // Default to waiver for Ohio
    return 'WAIVER';
  }

  private async getOhioEVVConfig(orgId: UUID) {
    const result = await this.database.query(`
      SELECT * FROM evv_state_config
      WHERE organization_id = $1 AND state_code = 'OH'
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
