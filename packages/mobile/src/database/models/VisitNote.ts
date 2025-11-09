/**
 * VisitNote Model - WatermelonDB model for visit documentation notes
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export type NoteType = 'care_notes' | 'incident' | 'vital_signs' | 'medication' | 'general';

export class VisitNote extends Model {
  static table = 'visit_notes';
  static associations = {
    visits: { type: 'belongs_to' as const, key: 'visit_id' },
    evv_records: { type: 'belongs_to' as const, key: 'evv_record_id' },
    note_templates: { type: 'belongs_to' as const, key: 'template_id' },
  };

  @field('visit_id') visitId!: string;
  @field('evv_record_id') evvRecordId!: string | null;
  @field('organization_id') organizationId!: string;
  @field('caregiver_id') caregiverId!: string;
  @field('client_id') clientId!: string;

  // Note content
  @field('note_text') noteText!: string;
  @field('note_html') noteHtml!: string | null;
  @field('note_type') noteType!: NoteType;
  @field('template_id') templateId!: string | null;

  // Voice-to-text metadata
  @field('is_voice_transcribed') isVoiceTranscribed!: boolean;
  @field('audio_uri') audioUri!: string | null;
  @field('transcription_confidence') transcriptionConfidence!: number | null;

  // Metadata
  @date('recorded_at') recordedAt!: Date;
  @field('duration_seconds') durationSeconds!: number | null;

  // Auto-save tracking
  @field('is_auto_saved') isAutoSaved!: boolean;
  @date('last_edited_at') lastEditedAt!: Date;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @field('sync_pending') syncPending!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
