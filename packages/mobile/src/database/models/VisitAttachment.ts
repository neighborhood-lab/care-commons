/**
 * Visit Attachment Model
 *
 * Represents photos, signatures, and other files attached to visits
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class VisitAttachment extends Model {
  static table = 'visit_attachments';

  @field('visit_id') visitId!: string;
  @field('evv_record_id') evvRecordId?: string;
  @field('organization_id') organizationId!: string;
  @field('caregiver_id') caregiverId!: string;

  // Attachment details
  @field('attachment_type') attachmentType!: 'PHOTO' | 'SIGNATURE' | 'DOCUMENT';
  @field('attachment_category') attachmentCategory!: 'CLOCK_IN' | 'CLOCK_OUT' | 'TASK' | 'INCIDENT' | 'GENERAL';
  @field('file_uri') fileUri!: string;
  @field('file_name') fileName!: string;
  @field('file_size') fileSize!: number;
  @field('mime_type') mimeType!: string;

  // Metadata
  @field('caption') caption?: string;
  @field('metadata_json') metadataJson?: string;

  // Upload status
  @field('upload_status') uploadStatus!: 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED';
  @field('upload_url') uploadUrl?: string;
  @field('upload_error') uploadError?: string;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @field('sync_pending') syncPending!: boolean;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Get parsed metadata
   */
  get metadata(): Record<string, unknown> | null {
    if (!this.metadataJson) return null;
    try {
      return JSON.parse(this.metadataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Set metadata
   */
  setMetadata(metadata: Record<string, unknown>) {
    return this.update(() => {
      this.metadataJson = JSON.stringify(metadata);
    });
  }
}
