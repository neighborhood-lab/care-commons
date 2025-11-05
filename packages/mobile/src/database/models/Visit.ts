/**
 * Visit Model - WatermelonDB model for offline-first visit storage
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';
import type { ServiceAddress } from '../../shared/index.js';
import type { VisitStatus } from '../../shared/index.js';

export class Visit extends Model {
  static table = 'visits';
  static associations = {
    evv_records: { type: 'has_many' as const, foreignKey: 'visit_id' },
    time_entries: { type: 'has_many' as const, foreignKey: 'visit_id' },
  };

  // Note: id is inherited from Model base class as an accessor

  @field('organization_id') organizationId!: string;
  @field('branch_id') branchId!: string;
  @field('client_id') clientId!: string;
  @field('caregiver_id') caregiverId!: string;

  @date('scheduled_start_time') scheduledStartTime!: Date;
  @date('scheduled_end_time') scheduledEndTime!: Date;
  @field('scheduled_duration') scheduledDuration!: number;

  @field('client_name') clientName!: string;
  @json('client_address_json', (json: unknown) => json) clientAddress!: ServiceAddress;

  @field('service_type_code') serviceTypeCode!: string;
  @field('service_type_name') serviceTypeName!: string;

  @field('status') status!: VisitStatus;

  @field('evv_record_id') evvRecordId!: string | null;

  @field('is_synced') isSynced!: boolean;
  @date('last_modified_at') lastModifiedAt!: Date;
  @field('sync_pending') syncPending!: boolean;
  @field('server_version') serverVersion!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
