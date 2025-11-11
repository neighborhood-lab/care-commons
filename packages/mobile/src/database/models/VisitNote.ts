/**
 * Visit Note Model - Enhanced
 *
 * Represents rich text notes for visit documentation with:
 * - Activities performed tracking
 * - Client mood/condition assessment
 * - Incident reporting
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class VisitNote extends Model {
  static table = 'visit_notes';

  @field('visit_id') visitId!: string;
  @field('evv_record_id') evvRecordId?: string;
  @field('organization_id') organizationId!: string;
  @field('caregiver_id') caregiverId!: string;

  // Note details
  @field('note_type') noteType!: 'GENERAL' | 'CLINICAL' | 'INCIDENT' | 'TASK';
  @field('note_text') noteText!: string;
  @field('note_html') noteHtml?: string;
  @field('template_id') templateId?: string;
  
  // Activities performed (JSON array of activity IDs)
  @field('activities_performed') activitiesPerformed?: string;
  
  // Client assessment
  @field('client_mood') clientMood?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DISTRESSED' | 'UNRESPONSIVE';
  @field('client_condition_notes') clientConditionNotes?: string;
  
  // Incident tracking
  @field('is_incident') isIncident!: boolean;
  @field('incident_severity') incidentSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  @field('incident_description') incidentDescription?: string;
  @field('incident_reported_at') incidentReportedAt?: number;

  // Voice-to-text
  @field('is_voice_note') isVoiceNote!: boolean;
  @field('audio_file_uri') audioFileUri?: string;
  @field('transcription_confidence') transcriptionConfidence?: number;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @field('sync_pending') syncPending!: boolean;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
