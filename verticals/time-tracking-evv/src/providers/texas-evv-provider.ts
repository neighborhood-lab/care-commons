import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';

/**
 * TX EVV Provider - HHAeXchange Aggregator integration
 * SOLID: Interface Segregation - implements only TX-specific methods
 * APIE: Polymorphism - can be swapped with other state providers
 */
export interface ITexasEVVProvider {
  submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission>;
  createVMUR(visitId: UUID, reason: string, requestedBy: UUID): Promise<VMUR>;
  validateClockMethod(method: string, location: LocationVerification): Promise<boolean>;
}

export class TexasEVVProvider implements ITexasEVVProvider {
  constructor(private database: Database) {}

  /**
   * Submit to HHAeXchange (TX mandated aggregator)
   * In production: replace with actual API call
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<AggregatorSubmission> {
    // Validate TX-specific requirements
    const config = await this.getTexasEVVConfig(evvRecord.organizationId);
    
    if (!config) {
      throw new Error('TX EVV configuration not found for organization');
    }

    // Prepare payload per HHSC specs
    const payload = {
      visitId: evvRecord.visitId,
      clientMedicaidId: evvRecord.clientMedicaidId,
      serviceTypeCode: evvRecord.serviceTypeCode,
      clockInTime: evvRecord.clockInTime,
      clockOutTime: evvRecord.clockOutTime,
      location: {
        latitude: evvRecord.clockInVerification.latitude,
        longitude: evvRecord.clockInVerification.longitude,
        method: evvRecord.clockInVerification.method
      },
      caregiverNPI: evvRecord.caregiverNationalProviderId,
      programType: config['medicaid_program']
    };

    // TODO: Replace with actual HHAeXchange API call
    // const response = await fetch('https://api.hhaeexchange.com/v2/visits', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${config.api_key}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // });

    // Store submission record
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'TX', $1, 'HHAEEXCHANGE', 'PRIMARY',
        $2::jsonb, 'JSON', $3, 'PENDING'
      ) RETURNING id
    `, [evvRecord.id, JSON.stringify(payload), evvRecord.recordedBy]);

    return {
      submissionId: submissionId.rows[0]!['id'] as UUID,
      status: 'PENDING',
      aggregator: 'HHAEEXCHANGE',
      submittedAt: new Date()
    };
  }

  /**
   * TX Visit Maintenance Unlock Request workflow
   */
  async createVMUR(visitId: UUID, reason: string, requestedBy: UUID): Promise<VMUR> {
    const vmurId = await this.database.query(`
      INSERT INTO texas_vmur (
        id, visit_id, reason_code, reason_description,
        requested_by, requested_at, approval_status, expires_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, NOW(), 'PENDING',
        NOW() + INTERVAL '30 days'
      ) RETURNING id
    `, [visitId, this.mapReasonToCode(reason), reason, requestedBy]);

    return {
      id: vmurId.rows[0]!['id'] as UUID,
      visitId,
      status: 'PENDING',
      requestedAt: new Date()
    };
  }

  /**
   * TX Clock method validation (GPS mandated for mobile visits)
   */
  async validateClockMethod(method: string, location: LocationVerification): Promise<boolean> {
    if (method !== 'GPS' && method !== 'TELEPHONY') {
      throw new Error('TX requires GPS or telephony (TVV) methods per HHSC policy');
    }

    // GPS accuracy must be ≤100m per TX standards
    if (method === 'GPS' && location.accuracy && location.accuracy > 100) {
      return false;
    }

    return true;
  }

  private async getTexasEVVConfig(orgId: UUID) {
    const result = await this.database.query(`
      SELECT * FROM evv_state_config
      WHERE organization_id = $1 AND state_code = 'TX'
    `, [orgId]);
    return result.rows[0];
  }

  private mapReasonToCode(reason: string): string {
    // TX-specific VMUR reason codes
    const codeMap: Record<string, string> = {
      'LATE_CLOCK_IN': 'TX_LATE_IN',
      'MISSING_CLOCK_OUT': 'TX_MISSING_OUT',
      'LOCATION_MISMATCH': 'TX_GEO_FAIL',
      'SYSTEM_ERROR': 'TX_SYS_ERR'
    };
    return codeMap[reason] || 'TX_OTHER';
  }
}

interface AggregatorSubmission {
  submissionId: UUID;
  status: string;
  aggregator: string;
  submittedAt: Date;
}

interface VMUR {
  id: UUID;
  visitId: UUID;
  status: string;
  requestedAt: Date;
}