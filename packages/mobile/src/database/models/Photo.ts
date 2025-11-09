/**
 * Photo Model - WatermelonDB model for visit documentation photos
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export type PhotoType = 'care_documentation' | 'incident' | 'task_completion' | 'general';
export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export class Photo extends Model {
  static table = 'photos';
  static associations = {
    visits: { type: 'belongs_to' as const, key: 'visit_id' },
    evv_records: { type: 'belongs_to' as const, key: 'evv_record_id' },
  };

  @field('visit_id') visitId!: string;
  @field('evv_record_id') evvRecordId!: string | null;
  @field('task_id') taskId!: string | null;
  @field('organization_id') organizationId!: string;
  @field('caregiver_id') caregiverId!: string;
  @field('client_id') clientId!: string;

  // Photo details
  @field('local_uri') localUri!: string;
  @field('remote_url') remoteUrl!: string | null;
  @field('file_name') fileName!: string;
  @field('file_size') fileSize!: number;
  @field('mime_type') mimeType!: string;
  @field('width') width!: number;
  @field('height') height!: number;

  // Metadata
  @field('caption') caption!: string | null;
  @field('photo_type') photoType!: PhotoType;
  @date('taken_at') takenAt!: Date;
  @json('location_json', (json: unknown) => json) location!: PhotoLocation | null;

  // Upload status
  @field('upload_status') uploadStatus!: UploadStatus;
  @field('upload_error') uploadError!: string | null;
  @date('uploaded_at') uploadedAt!: Date | null;

  // HIPAA compliance
  @field('is_hipaa_compliant') isHipaaCompliant!: boolean;
  @field('encryption_key_id') encryptionKeyId!: string | null;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @field('sync_pending') syncPending!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
