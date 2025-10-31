import { UUID } from '@care-commons/core';
import { EVVRecord } from '../types/evv';
import { Database } from '@care-commons/core';

/**
 * FL EVV Provider - Multi-aggregator support (HHAeXchange, Netsmart)
 * APIE: Encapsulation - aggregator routing logic is internal
 */
export interface IFloridaEVVProvider {
  submitToAggregators(evvRecord: EVVRecord): Promise<AggregatorSubmission[]>;
  routeByMCO(clientId: UUID): Promise<string>;
}

export class FloridaEVVProvider implements IFloridaEVVProvider {
  constructor(private database: Database) {}

  /**
   * FL allows multiple aggregators - route by client's MCO
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

    // TODO: Replace with actual aggregator API calls
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
      submissionId: submissionId.rows[0].id as UUID,
      status: 'PENDING',
      aggregator,
      submittedAt: new Date()
    }];
  }

  /**
   * Route to correct aggregator based on client's MCO
   */
  async routeByMCO(clientId: UUID): Promise<string> {
    const result = await this.database.query(`
      SELECT state_specific->'florida'->>'evv_aggregator' as aggregator
      FROM clients
      WHERE id = $1
    `, [clientId]);

    return (result.rows[0]?.aggregator as string) || 'HHAEEXCHANGE';
  }
}

interface AggregatorSubmission {
  submissionId: UUID;
  status: string;
  aggregator: string;
  submittedAt: Date;
}