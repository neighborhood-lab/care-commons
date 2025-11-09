import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';
import { ValidationResult } from '../aggregators/base-aggregator';

/**
 * Georgia EVV Provider - Tellus Aggregator integration
 *
 * Georgia Department of Community Health (DCH) requirements:
 * - Aggregator: Tellus (Netsmart)
 * - Geofence radius: 1 mile (1609 meters)
 * - Visit tolerance: ±15 minutes
 * - Different rules for CFC vs. HCBS waiver programs
 * - Lenient rural exception handling
 *
 * SOLID: Interface Segregation - implements only GA-specific methods
 * APIE: Polymorphism - can be swapped with other state providers
 */
export interface IGeorgiaEVVProvider {
  submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission>;
  validateVisit(evvRecord: EVVRecord): ValidationResult;
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean;
  determineProgram(clientId: UUID): Promise<'CFC' | 'HCBS'>;
}

export class GeorgiaEVVProvider implements IGeorgiaEVVProvider {
  constructor(private database: Database) {}

  /**
   * Submit to Tellus (Georgia's designated aggregator)
   *
   * Georgia uses Tellus (Netsmart) for EVV aggregation with HCBS waiver focus.
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission> {
    // Validate GA-specific requirements
    const config = await this.getGeorgiaEVVConfig(evvRecord.organizationId);

    if (!config) {
      throw new Error('GA EVV configuration not found for organization');
    }

    // Determine program type (CFC vs HCBS)
    const programType = await this.determineProgram(evvRecord.clientId);

    // Prepare payload per Tellus Georgia specs
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

      // Georgia-specific fields
      visitId: evvRecord.visitId,
      organizationId: evvRecord.organizationId,
      medicaidId: evvRecord.stateSpecificData?.['medicaidID'],
      programType: programType,
      waiverProgram: config['medicaid_program'],
      isRuralArea: evvRecord.stateSpecificData?.['isRuralArea'] || false,
    };

    // Store submission record
    // EVVRecord extends Entity which has an id field
    const evvRecordWithId = evvRecord as EVVRecord & { id: UUID };
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'GA', $1, 'TELLUS', 'PRIMARY',
        $2::jsonb, 'JSON', $3, 'PENDING'
      ) RETURNING id
    `, [evvRecordWithId.id, JSON.stringify(payload), evvRecord.recordedBy]);

    return {
      submissionId: submissionId.rows[0]!['id'] as UUID,
      status: 'PENDING',
      aggregator: 'TELLUS',
      submittedAt: new Date()
    };
  }

  /**
   * Validate visit against Georgia-specific rules
   */
  validateVisit(evvRecord: EVVRecord): ValidationResult {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!evvRecord.clientMedicaidId && !evvRecord.stateSpecificData?.['medicaidID']) {
      errors.push({
        field: 'medicaidID',
        code: 'GA_MISSING_MEDICAID_ID',
        message: 'Georgia requires Medicaid ID for EVV submission',
        severity: 'ERROR' as const
      });
    }

    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'GA_MISSING_SERVICE_TYPE',
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
        // Georgia is more lenient for rural areas
        const isRural = evvRecord.stateSpecificData?.['isRuralArea'] === true;
        if (isRural && diffMinutes <= 30) {
          warnings.push({
            field: 'clockInTime',
            code: 'GA_VISIT_TOLERANCE_RURAL',
            message: `Clock-in is ${Math.round(diffMinutes)} minutes from scheduled time (rural tolerance applied)`,
            severity: 'WARNING' as const
          });
        } else if (!isRural) {
          warnings.push({
            field: 'clockInTime',
            code: 'GA_VISIT_TOLERANCE_EXCEEDED',
            message: `Clock-in is ${Math.round(diffMinutes)} minutes from scheduled time (tolerance: ±15 minutes)`,
            severity: 'WARNING' as const
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate geofence with Georgia's 1-mile radius requirement
   */
  validateGeofence(location: LocationVerification, serviceAddress: ServiceAddress): boolean {
    const GA_GEOFENCE_RADIUS_METERS = 1609; // 1 mile

    if (!serviceAddress.latitude || !serviceAddress.longitude) {
      return false;
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceAddress.latitude,
      serviceAddress.longitude
    );

    return distance <= GA_GEOFENCE_RADIUS_METERS;
  }

  /**
   * Determine if client is CFC (Community First Choice) or HCBS waiver
   *
   * Georgia has different requirements for:
   * - CFC: Community First Choice (newer program)
   * - HCBS: Home and Community-Based Services waivers (traditional)
   */
  async determineProgram(clientId: UUID): Promise<'CFC' | 'HCBS'> {
    const result = await this.database.query(`
      SELECT
        state_specific->'georgia'->>'programType' as program_type,
        state_specific->'georgia'->>'waiverProgram' as waiver_program
      FROM clients
      WHERE id = $1
    `, [clientId]);

    const row = result.rows[0];

    // Check explicit program type
    if (row?.['program_type'] === 'CFC') {
      return 'CFC';
    }

    // Check waiver program codes
    const waiverProgram = row?.['waiver_program'] as string | undefined;
    const cfcPrograms = ['CCSP', 'SOURCE'];

    if (waiverProgram && cfcPrograms.includes(waiverProgram)) {
      return 'CFC';
    }

    // Default to HCBS
    return 'HCBS';
  }

  private async getGeorgiaEVVConfig(orgId: UUID) {
    const result = await this.database.query(`
      SELECT * FROM evv_state_config
      WHERE organization_id = $1 AND state_code = 'GA'
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
