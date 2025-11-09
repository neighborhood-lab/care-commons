/**
 * Signature Model - WatermelonDB model for client signatures
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export type SignatureType = 'client' | 'caregiver' | 'supervisor';
export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface SignatureLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  timestamp: number;
}

export class Signature extends Model {
  static table = 'signatures';
  static associations = {
    visits: { type: 'belongs_to' as const, key: 'visit_id' },
    evv_records: { type: 'belongs_to' as const, key: 'evv_record_id' },
  };

  @field('visit_id') visitId!: string;
  @field('evv_record_id') evvRecordId!: string | null;
  @field('organization_id') organizationId!: string;
  @field('caregiver_id') caregiverId!: string;
  @field('client_id') clientId!: string;

  // Signature data
  @field('signature_type') signatureType!: SignatureType;
  @field('local_uri') localUri!: string;
  @field('remote_url') remoteUrl!: string | null;
  @field('signature_data_url') signatureDataUrl!: string; // Base64 data URL
  @field('file_size') fileSize!: number;

  // Attestation
  @field('attestation_text') attestationText!: string;
  @field('signer_name') signerName!: string;
  @date('signed_at') signedAt!: Date;

  // Device info for integrity
  @json('device_info_json', (json: unknown) => json) deviceInfo!: DeviceInfo;
  @json('location_json', (json: unknown) => json) location!: SignatureLocation | null;

  // Cryptographic integrity
  @field('integrity_hash') integrityHash!: string;
  @field('hash_algorithm') hashAlgorithm!: string;

  // Upload status
  @field('upload_status') uploadStatus!: UploadStatus;
  @field('upload_error') uploadError!: string | null;
  @date('uploaded_at') uploadedAt!: Date | null;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @field('sync_pending') syncPending!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
