import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';
import { ValidationResult } from '../aggregators/base-aggregator';

/**
 * Arizona EVV Provider - Sandata Aggregator integration
 *
 * Arizona Health Care Cost Containment System (AHCCCS) requirements:
 * - Aggregator: Sandata
 * - Geofence radius: 1 mile (1609 meters)
 * - Visit tolerance: ±15 minutes
 * - DDD vs. ALTCS program differences
 * - Non-medical services exempt from NPI requirement
 * - AHCCCS ID required
 *
 * SOLID: Interface Segregation - implements only AZ-specific methods
 * APIE: Polymorphism - can be swapped with other state providers
 */
export interface IArizonaEVVProvider {
  submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission>;
  validateVisit(evvRecord: EVVRecord): ValidationResult;
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean;
  determineProgram(clientId: UUID): Promise<'DDD' | 'ALTCS' | 'EPD' | 'SMI'>;
}

export class ArizonaEVVProvider implements IArizonaEVVProvider {
  constructor(private database: Database) {}

  /**
   * Submit to Sandata (Arizona's designated aggregator)
   *
   * Arizona uses Sandata with AHCCCS-specific requirements.
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission> {
    // Validate AZ-specific requirements
    const config = await this.getArizonaEVVConfig(evvRecord.organizationId);

    if (!config) {
      throw new Error('AZ EVV configuration not found for organization');
    }

    // Determine program type (DDD, ALTCS, EPD, SMI)
    const programType = await this.determineProgram(evvRecord.clientId);

    // Prepare payload per Sandata Arizona specs
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

      // Arizona-specific fields
      visitId: evvRecord.visitId,
      organizationId: evvRecord.organizationId,
      ahcccsId: evvRecord.stateSpecificData?.['ahcccsID'],
      programType: programType,
      ltcProgram: config['medicaid_program'],
      isNonMedical: this.isNonMedicalService(evvRecord.serviceTypeCode),
    };

    // Store submission record
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'AZ', $1, 'SANDATA', 'PRIMARY',
        $2::jsonb, 'JSON', $3, 'PENDING'
      ) RETURNING id
    `, [evvRecord.id, JSON.stringify(payload), evvRecord.recordedBy]);

    return {
      submissionId: submissionId.rows[0]!['id'] as UUID,
      status: 'PENDING',
      aggregator: 'SANDATA',
      submittedAt: new Date()
    };
  }

  /**
   * Validate visit against Arizona-specific rules
   */
  validateVisit(evvRecord: EVVRecord): ValidationResult {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!evvRecord.clientMedicaidId && !evvRecord.stateSpecificData?.['ahcccsID']) {
      errors.push({
        field: 'ahcccsID',
        code: 'AZ_MISSING_AHCCCS_ID',
        message: 'Arizona requires AHCCCS ID for EVV submission',
        severity: 'ERROR' as const
      });
    }

    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'AZ_MISSING_SERVICE_TYPE',
        message: 'Service type code is required',
        severity: 'ERROR' as const
      });
    }

    // Check NPI requirement (exempt for non-medical services)
    const isNonMedical = this.isNonMedicalService(evvRecord.serviceTypeCode);
    if (!isNonMedical && !evvRecord.caregiverNationalProviderId) {
      warnings.push({
        field: 'caregiverNationalProviderId',
        code: 'AZ_MISSING_NPI',
        message: 'Medical services typically require NPI number',
        severity: 'WARNING' as const
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
          code: 'AZ_VISIT_TOLERANCE_EXCEEDED',
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
   * Validate geofence with Arizona's 1-mile radius requirement
   */
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean {
    const AZ_GEOFENCE_RADIUS_METERS = 1609; // 1 mile

    if (!serviceAddress.latitude || !serviceAddress.longitude) {
      return false;
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceAddress.latitude,
      serviceAddress.longitude
    );

    return distance <= AZ_GEOFENCE_RADIUS_METERS;
  }

  /**
   * Determine AHCCCS program type
   *
   * Arizona has different programs:
   * - DDD: Division of Developmental Disabilities
   * - ALTCS: Arizona Long Term Care System
   * - EPD: Elderly and Physically Disabled
   * - SMI: Seriously Mentally Ill
   */
  async determineProgram(clientId: UUID): Promise<'DDD' | 'ALTCS' | 'EPD' | 'SMI'> {
    const result = await this.database.query(`
      SELECT
        state_specific->'arizona'->>'programType' as program_type,
        state_specific->'arizona'->>'ltcProgram' as ltc_program
      FROM clients
      WHERE id = $1
    `, [clientId]);

    const row = result.rows[0];

    // Check explicit program type
    if (row?.['program_type']) {
      const programType = row['program_type'] as string;
      if (['DDD', 'ALTCS', 'EPD', 'SMI'].includes(programType)) {
        return programType as 'DDD' | 'ALTCS' | 'EPD' | 'SMI';
      }
    }

    // Check LTC program
    const ltcProgram = row?.['ltc_program'] as string | undefined;
    if (ltcProgram === 'DDD_WAIVER') {
      return 'DDD';
    }
    if (ltcProgram === 'EPD_WAIVER') {
      return 'EPD';
    }

    // Default to ALTCS
    return 'ALTCS';
  }

  /**
   * Check if service is non-medical (exempt from NPI requirement)
   */
  private isNonMedicalService(serviceTypeCode: string): boolean {
    const nonMedicalCodes = [
      'PCA', // Personal Care Attendant
      'RESPITE',
      'HOMEMAKER',
      'COMPANION',
      'CHORE',
      'TRANSPORTATION',
    ];

    return nonMedicalCodes.includes(serviceTypeCode);
  }

  private async getArizonaEVVConfig(orgId: UUID) {
    const result = await this.database.query(`
      SELECT * FROM evv_state_config
      WHERE organization_id = $1 AND state_code = 'AZ'
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
