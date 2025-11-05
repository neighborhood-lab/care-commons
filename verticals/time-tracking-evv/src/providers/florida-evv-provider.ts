import { UUID } from '@care-commons/core';
import { EVVRecord } from '../types/evv';
import { Database } from '@care-commons/core';

/**
 * FL EVV Provider - Multi-aggregator support
 *
 * Florida's unique EVV landscape allows agencies to choose from multiple aggregators.
 * Different MCOs may prefer different aggregators.
 *
 * Supported Aggregators:
 * - HHAeXchange (most common, default)
 * - Tellus/Netsmart
 * - iConnect
 *
 * Routing Priority:
 * 1. Client's preferred aggregator (if set)
 * 2. MCO-specific aggregator assignments
 * 3. Default agency aggregator
 *
 * APIE: Encapsulation - aggregator routing logic is internal
 */
export interface IFloridaEVVProvider {
  submitToAggregators(evvRecord: EVVRecord): Promise<AggregatorSubmission[]>;
  routeByMCO(clientId: UUID): Promise<string>;
  getAggregatorConfig(aggregatorId: string): AggregatorConfig | undefined;
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  id: string;
  name: string;
  type: 'HHAEEXCHANGE' | 'TELLUS' | 'ICONNECT' | 'OTHER';
  endpoint: string;
  assignedMCOs?: string[];  // MCOs that prefer this aggregator
  isDefault?: boolean;
}

/**
 * MCO-to-Aggregator mapping for Florida
 */
const FLORIDA_MCO_AGGREGATOR_MAP: Record<string, string> = {
  'SUNSHINE_HEALTH': 'HHAEEXCHANGE',
  'MOLINA': 'HHAEEXCHANGE',
  'SIMPLY': 'HHAEEXCHANGE',
  'WELLCARE': 'TELLUS',
  'UNITED': 'TELLUS',
  'FLORIDA_COMMUNITY_CARE': 'HHAEEXCHANGE',
};

/**
 * Default aggregator configurations for Florida
 */
const FLORIDA_AGGREGATOR_CONFIGS: AggregatorConfig[] = [
  {
    id: 'hhaeexchange-fl',
    name: 'HHAeXchange',
    type: 'HHAEEXCHANGE',
    endpoint: 'https://api.hhaeexchange.com/florida/evv/v1',
    assignedMCOs: ['SUNSHINE_HEALTH', 'MOLINA', 'SIMPLY'],
    isDefault: true,
  },
  {
    id: 'tellus-fl',
    name: 'Tellus (Netsmart)',
    type: 'TELLUS',
    endpoint: 'https://api.tellus.netsmart.com/florida/evv/v1',
    assignedMCOs: ['WELLCARE', 'UNITED'],
  },
  {
    id: 'iconnect-fl',
    name: 'iConnect',
    type: 'ICONNECT',
    endpoint: 'https://api.iconnect.com/florida/evv/v1',
    assignedMCOs: [],
  },
];

export class FloridaEVVProvider implements IFloridaEVVProvider {
  constructor(private database: Database) {}

  /**
   * FL allows multiple aggregators - route by client's MCO or preference
   *
   * Priority:
   * 1. Client's explicit preferred_aggregator setting
   * 2. MCO-specific aggregator mapping
   * 3. Default HHAeXchange
   */
  async submitToAggregators(evvRecord: EVVRecord): Promise<AggregatorSubmission[]> {
    const aggregator = await this.routeByMCO(evvRecord.clientId);

    const payload = {
      visitId: evvRecord.visitId,
      curesActData: {
        serviceType: evvRecord.serviceTypeCode,
        serviceRecipient: evvRecord.clientMedicaidId,
        serviceProvider: evvRecord.caregiverEmployeeId,
        serviceDate: evvRecord.serviceDate,
        location: {
          latitude: evvRecord.clockInVerification.latitude,
          longitude: evvRecord.clockInVerification.longitude
        },
        timeStart: evvRecord.clockInTime,
        timeEnd: evvRecord.clockOutTime
      }
    };

    // Store submission record in database
    const submissionId = await this.database.query(`
      INSERT INTO state_aggregator_submissions (
        id, state_code, evv_record_id, aggregator_id, aggregator_type,
        submission_payload, submission_format, submitted_by, submission_status
      ) VALUES (
        gen_random_uuid(), 'FL', $1, $2, 'MCO_ASSIGNED',
        $3::jsonb, 'JSON', $4, 'PENDING'
      ) RETURNING id
    `, [evvRecord.id, aggregator, JSON.stringify(payload), evvRecord.recordedBy]);

    return [{
      submissionId: submissionId.rows[0]!['id'] as UUID,
      status: 'PENDING',
      aggregator,
      submittedAt: new Date()
    }];
  }

  /**
   * Route to correct aggregator based on client's MCO and preferences
   *
   * @param clientId - Client UUID
   * @returns Aggregator ID to use
   */
  async routeByMCO(clientId: UUID): Promise<string> {
    const result = await this.database.query(`
      SELECT
        state_specific->'florida'->>'preferredAggregator' as preferred_aggregator,
        state_specific->'florida'->>'mcoName' as mco_name
      FROM clients
      WHERE id = $1
    `, [clientId]);

    const row = result.rows[0];

    // 1. Check client's preferred aggregator
    if (row?.['preferred_aggregator']) {
      return row['preferred_aggregator'] as string;
    }

    // 2. Check MCO-specific mapping
    const mcoName = row?.['mco_name'] as string | undefined;
    if (mcoName && FLORIDA_MCO_AGGREGATOR_MAP[mcoName]) {
      return FLORIDA_MCO_AGGREGATOR_MAP[mcoName]!;
    }

    // 3. Default to HHAeXchange (most common in Florida)
    return 'HHAEEXCHANGE';
  }

  /**
   * Get aggregator configuration
   */
  getAggregatorConfig(aggregatorId: string): AggregatorConfig | undefined {
    return FLORIDA_AGGREGATOR_CONFIGS.find(config => config.id === aggregatorId || config.type === aggregatorId);
  }
}

interface AggregatorSubmission {
  submissionId: UUID;
  status: string;
  aggregator: string;
  submittedAt: Date;
}