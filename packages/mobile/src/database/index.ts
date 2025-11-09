/**
 * Database configuration and initialization
 * 
 * This module sets up WatermelonDB for offline-first data persistence.
 * It handles database initialization, migrations, and provides the database
 * instance for use throughout the mobile app.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import type { SchemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { schema } from './schema.js';
import {
  Visit,
  Photo,
  Signature,
  VisitNote,
  NoteTemplate,
  Notification
} from './models/index.js';
import { createTable } from '@nozbe/watermelondb/Schema/migrations';

// Schema migrations - adding new tables in version 2
const migrations: SchemaMigrations = schemaMigrations({
  migrations: [
    // Version 2: Add photos, signatures, visit_notes, note_templates, notifications tables
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'photos',
          columns: [
            { name: 'visit_id', type: 'string', isIndexed: true },
            { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'task_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'organization_id', type: 'string', isIndexed: true },
            { name: 'caregiver_id', type: 'string', isIndexed: true },
            { name: 'client_id', type: 'string', isIndexed: true },
            { name: 'local_uri', type: 'string' },
            { name: 'remote_url', type: 'string', isOptional: true },
            { name: 'file_name', type: 'string' },
            { name: 'file_size', type: 'number' },
            { name: 'mime_type', type: 'string' },
            { name: 'width', type: 'number' },
            { name: 'height', type: 'number' },
            { name: 'caption', type: 'string', isOptional: true },
            { name: 'photo_type', type: 'string', isIndexed: true },
            { name: 'taken_at', type: 'number', isIndexed: true },
            { name: 'location_json', type: 'string', isOptional: true },
            { name: 'upload_status', type: 'string', isIndexed: true },
            { name: 'upload_error', type: 'string', isOptional: true },
            { name: 'uploaded_at', type: 'number', isOptional: true },
            { name: 'is_hipaa_compliant', type: 'boolean' },
            { name: 'encryption_key_id', type: 'string', isOptional: true },
            { name: 'is_synced', type: 'boolean', isIndexed: true },
            { name: 'sync_pending', type: 'boolean', isIndexed: true },
            { name: 'created_at', type: 'number', isIndexed: true },
            { name: 'updated_at', type: 'number', isIndexed: true },
          ],
        }),
        createTable({
          name: 'signatures',
          columns: [
            { name: 'visit_id', type: 'string', isIndexed: true },
            { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'organization_id', type: 'string', isIndexed: true },
            { name: 'caregiver_id', type: 'string', isIndexed: true },
            { name: 'client_id', type: 'string', isIndexed: true },
            { name: 'signature_type', type: 'string', isIndexed: true },
            { name: 'local_uri', type: 'string' },
            { name: 'remote_url', type: 'string', isOptional: true },
            { name: 'signature_data_url', type: 'string' },
            { name: 'file_size', type: 'number' },
            { name: 'attestation_text', type: 'string' },
            { name: 'signer_name', type: 'string' },
            { name: 'signed_at', type: 'number', isIndexed: true },
            { name: 'device_info_json', type: 'string' },
            { name: 'location_json', type: 'string', isOptional: true },
            { name: 'integrity_hash', type: 'string' },
            { name: 'hash_algorithm', type: 'string' },
            { name: 'upload_status', type: 'string', isIndexed: true },
            { name: 'upload_error', type: 'string', isOptional: true },
            { name: 'uploaded_at', type: 'number', isOptional: true },
            { name: 'is_synced', type: 'boolean', isIndexed: true },
            { name: 'sync_pending', type: 'boolean', isIndexed: true },
            { name: 'created_at', type: 'number', isIndexed: true },
            { name: 'updated_at', type: 'number', isIndexed: true },
          ],
        }),
        createTable({
          name: 'visit_notes',
          columns: [
            { name: 'visit_id', type: 'string', isIndexed: true },
            { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'organization_id', type: 'string', isIndexed: true },
            { name: 'caregiver_id', type: 'string', isIndexed: true },
            { name: 'client_id', type: 'string', isIndexed: true },
            { name: 'note_text', type: 'string' },
            { name: 'note_html', type: 'string', isOptional: true },
            { name: 'note_type', type: 'string', isIndexed: true },
            { name: 'template_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'is_voice_transcribed', type: 'boolean' },
            { name: 'audio_uri', type: 'string', isOptional: true },
            { name: 'transcription_confidence', type: 'number', isOptional: true },
            { name: 'recorded_at', type: 'number', isIndexed: true },
            { name: 'duration_seconds', type: 'number', isOptional: true },
            { name: 'is_auto_saved', type: 'boolean' },
            { name: 'last_edited_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean', isIndexed: true },
            { name: 'sync_pending', type: 'boolean', isIndexed: true },
            { name: 'created_at', type: 'number', isIndexed: true },
            { name: 'updated_at', type: 'number', isIndexed: true },
          ],
        }),
        createTable({
          name: 'note_templates',
          columns: [
            { name: 'organization_id', type: 'string', isIndexed: true },
            { name: 'template_name', type: 'string', isIndexed: true },
            { name: 'template_category', type: 'string', isIndexed: true },
            { name: 'template_text', type: 'string' },
            { name: 'template_html', type: 'string', isOptional: true },
            { name: 'variables_json', type: 'string', isOptional: true },
            { name: 'usage_count', type: 'number' },
            { name: 'last_used_at', type: 'number', isOptional: true },
            { name: 'sort_order', type: 'number', isIndexed: true },
            { name: 'is_active', type: 'boolean', isIndexed: true },
            { name: 'is_default', type: 'boolean' },
            { name: 'is_synced', type: 'boolean', isIndexed: true },
            { name: 'last_synced_at', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number', isIndexed: true },
            { name: 'updated_at', type: 'number', isIndexed: true },
          ],
        }),
        createTable({
          name: 'notifications',
          columns: [
            { name: 'notification_id', type: 'string', isIndexed: true },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'organization_id', type: 'string', isIndexed: true },
            { name: 'title', type: 'string' },
            { name: 'body', type: 'string' },
            { name: 'notification_type', type: 'string', isIndexed: true },
            { name: 'priority', type: 'string' },
            { name: 'related_entity_type', type: 'string', isOptional: true, isIndexed: true },
            { name: 'related_entity_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'action_data_json', type: 'string', isOptional: true },
            { name: 'is_read', type: 'boolean', isIndexed: true },
            { name: 'read_at', type: 'number', isOptional: true },
            { name: 'is_dismissed', type: 'boolean' },
            { name: 'dismissed_at', type: 'number', isOptional: true },
            { name: 'scheduled_for', type: 'number', isOptional: true, isIndexed: true },
            { name: 'sent_at', type: 'number', isOptional: true, isIndexed: true },
            { name: 'received_at', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number', isIndexed: true },
            { name: 'updated_at', type: 'number', isIndexed: true },
          ],
        }),
      ],
    },
  ],
});

// Configure SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Production apps should use JSI for better performance
  jsi: true,
  // Migrations will be added here as schema evolves
  migrations,
  onSetUpError: (error: Error) => {
    // Handle setup errors - could send to error tracking service
    console.error('Database setup error:', error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    Visit,
    Photo,
    Signature,
    VisitNote,
    NoteTemplate,
    Notification,
  ],
});

/**
 * Reset database (for development/testing only)
 * WARNING: This deletes all local data!
 */
export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

/**
 * Get database health status
 */
export async function getDatabaseStatus() {
  try {
    const visits = await database.get<Visit>('visits').query().fetchCount();
    
    return {
      isHealthy: true,
      collections: {
        visits,
      },
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
