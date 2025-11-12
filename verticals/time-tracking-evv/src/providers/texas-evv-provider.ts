import { UUID } from '@care-commons/core';
import { EVVRecord, LocationVerification } from '../types/evv';
import { Database } from '@care-commons/core';
import { HHAeXchangeClient, HHAeXchangeConfig, HHAeXchangeVisitPayload } from './hhaexchange-client.js';

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
  private hhaClient: HHAeXchangeClient | null = null;

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

    // Initialize HHAeXchange client if not already done (and credentials configured)
    if (!this.hhaClient) {
      try {
        this.hhaClient = await this.initializeHHAClient(evvRecord.organizationId);
      } catch (error) {
        // Credentials not configured - will queue for later submission
        console.warn('[TexasEVVProvider] HHAeXchange client not initialized:', error);
      }
    }

    // Submit to HHAeXchange API (if client is initialized)
    let aggregatorResponse;
    let submissionStatus: 'SUBMITTED' | 'PENDING' | 'FAILED';

    if (this.hhaClient) {
      try {
        const visitPayload: HHAeXchangeVisitPayload = {
          visitId: evvRecord.visitId,
          memberId: evvRecord.clientMedicaidId || '',
          providerId: (config['agency_npi'] as string) || '',
          caregiverId: evvRecord.caregiverNationalProviderId || '',
          serviceTypeCode: evvRecord.serviceTypeCode || '',
          serviceStartDateTime: evvRecord.clockInTime.toISOString(),
          serviceEndDateTime: evvRecord.clockOutTime?.toISOString(),
          location: {
            latitude: evvRecord.clockInVerification.latitude,
            longitude: evvRecord.clockInVerification.longitude,
            accuracy: evvRecord.clockInVerification.accuracy
          },
          programType: (config['medicaid_program'] as string) || 'STAR+PLUS'
        };

        aggregatorResponse = await this.hhaClient.submitVisit(visitPayload);
        submissionStatus = aggregatorResponse.success ? 'SUBMITTED' : 'FAILED';
      } catch (error) {
        console.error('[TexasEVVProvider] HHAeXchange submission failed:', error);
        submissionStatus = 'FAILED';
        // Continue to store failed submission for retry queue
      }
    } else {
      // Client not initialized (credentials missing) - queue for later
      submissionStatus = 'PENDING';
    }

    // Store submission record
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status,
        aggregator_response, submitted_at
      ) VALUES (
        gen_random_uuid(), 'TX', $1, 'HHAEEXCHANGE', 'PRIMARY',
        $2::jsonb, 'JSON', $3, $4,
        $5::jsonb, NOW()
      ) RETURNING id
    `, [
      evvRecord.id,
      JSON.stringify(payload),
      evvRecord.recordedBy,
      submissionStatus,
      aggregatorResponse ? JSON.stringify(aggregatorResponse) : null
    ]);

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

  /**
   * Initialize HHAeXchange client with credentials from environment/config
   */
  private async initializeHHAClient(orgId: UUID): Promise<HHAeXchangeClient> {
    const config = await this.getTexasEVVConfig(orgId);

    if (!config) {
      throw new Error('Texas EVV configuration not found');
    }

    // Use environment variables for credentials (never store in DB)
    const clientId = process.env.HHAEXCHANGE_CLIENT_ID || '';
    const clientSecret = process.env.HHAEXCHANGE_CLIENT_SECRET || '';
    const baseURL = process.env.HHAEXCHANGE_BASE_URL || 'https://sandbox.hhaexchange.com/api';

    if (!clientId || !clientSecret) {
      console.warn('[TexasEVVProvider] HHAeXchange credentials not configured - submissions will be queued');
      throw new Error('HHAeXchange credentials not configured');
    }

    const hhaConfig: HHAeXchangeConfig = {
      clientId,
      clientSecret,
      baseURL,
      agencyId: (config['agency_id'] as string) || ''
    };

    return new HHAeXchangeClient(hhaConfig);
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