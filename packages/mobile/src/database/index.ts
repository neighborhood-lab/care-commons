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
import { schema } from './schema';
import { Visit, VisitAttachment, VisitNote, NoteTemplate, Notification } from './models/index';

// Schema migrations
// v1 to v2: Added attachments, notes, templates, and notifications
// v2 to v3: Enhanced visit_notes with activities, mood, and incident tracking
const migrations: SchemaMigrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        {
          type: 'create_table',
          schema: {
            name: 'visit_attachments',
            // @ts-expect-error - WatermelonDB migration column type inference issue
            columns: [
              { name: 'visit_id', type: 'string', isIndexed: true },
              { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
              { name: 'organization_id', type: 'string', isIndexed: true },
              { name: 'caregiver_id', type: 'string', isIndexed: true },
              { name: 'attachment_type', type: 'string', isIndexed: true },
              { name: 'attachment_category', type: 'string', isIndexed: true },
              { name: 'file_uri', type: 'string' },
              { name: 'file_name', type: 'string' },
              { name: 'file_size', type: 'number' },
              { name: 'mime_type', type: 'string' },
              { name: 'caption', type: 'string', isOptional: true },
              { name: 'metadata_json', type: 'string', isOptional: true },
              { name: 'upload_status', type: 'string', isIndexed: true },
              { name: 'upload_url', type: 'string', isOptional: true },
              { name: 'upload_error', type: 'string', isOptional: true },
              { name: 'is_synced', type: 'boolean', isIndexed: true },
              { name: 'sync_pending', type: 'boolean', isIndexed: true },
              { name: 'created_at', type: 'number', isIndexed: true },
              { name: 'updated_at', type: 'number', isIndexed: true },
            ],
          },
        },
        {
          type: 'create_table',
          schema: {
            name: 'visit_notes',
            // @ts-expect-error - WatermelonDB migration column type inference issue
            columns: [
              { name: 'visit_id', type: 'string', isIndexed: true },
              { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
              { name: 'organization_id', type: 'string', isIndexed: true },
              { name: 'caregiver_id', type: 'string', isIndexed: true },
              { name: 'note_type', type: 'string', isIndexed: true },
              { name: 'note_text', type: 'string' },
              { name: 'note_html', type: 'string', isOptional: true },
              { name: 'template_id', type: 'string', isOptional: true, isIndexed: true },
              { name: 'is_voice_note', type: 'boolean', isIndexed: true },
              { name: 'audio_file_uri', type: 'string', isOptional: true },
              { name: 'transcription_confidence', type: 'number', isOptional: true },
              { name: 'is_synced', type: 'boolean', isIndexed: true },
              { name: 'sync_pending', type: 'boolean', isIndexed: true },
              { name: 'created_at', type: 'number', isIndexed: true },
              { name: 'updated_at', type: 'number', isIndexed: true },
            ],
          },
        },
        {
          type: 'create_table',
          schema: {
            name: 'note_templates',
            // @ts-expect-error - WatermelonDB migration column type inference issue
            columns: [
              { name: 'organization_id', type: 'string', isIndexed: true },
              { name: 'template_name', type: 'string' },
              { name: 'template_category', type: 'string', isIndexed: true },
              { name: 'template_text', type: 'string' },
              { name: 'template_fields_json', type: 'string', isOptional: true },
              { name: 'is_active', type: 'boolean', isIndexed: true },
              { name: 'sort_order', type: 'number', isIndexed: true },
              { name: 'is_synced', type: 'boolean', isIndexed: true },
              { name: 'last_synced_at', type: 'number', isOptional: true },
              { name: 'created_at', type: 'number', isIndexed: true },
              { name: 'updated_at', type: 'number', isIndexed: true },
            ],
          },
        },
        {
          type: 'create_table',
          schema: {
            name: 'notifications',
            // @ts-expect-error - WatermelonDB migration column type inference issue
            columns: [
              { name: 'notification_type', type: 'string', isIndexed: true },
              { name: 'title', type: 'string' },
              { name: 'body', type: 'string' },
              { name: 'data_json', type: 'string', isOptional: true },
              { name: 'visit_id', type: 'string', isOptional: true, isIndexed: true },
              { name: 'user_id', type: 'string', isIndexed: true },
              { name: 'scheduled_at', type: 'number', isOptional: true, isIndexed: true },
              { name: 'delivered_at', type: 'number', isOptional: true, isIndexed: true },
              { name: 'status', type: 'string', isIndexed: true },
              { name: 'is_read', type: 'boolean', isIndexed: true },
              { name: 'created_at', type: 'number', isIndexed: true },
              { name: 'updated_at', type: 'number', isIndexed: true },
            ],
          },
        },
      ],
    },
    {
      toVersion: 3,
      steps: [
        {
          type: 'add_columns',
          table: 'visit_notes',
          columns: [
            { name: 'activities_performed', type: 'string', isOptional: true },
            { name: 'client_mood', type: 'string', isOptional: true, isIndexed: true },
            { name: 'client_condition_notes', type: 'string', isOptional: true },
            { name: 'is_incident', type: 'boolean', isIndexed: true },
            { name: 'incident_severity', type: 'string', isOptional: true, isIndexed: true },
            { name: 'incident_description', type: 'string', isOptional: true },
            { name: 'incident_reported_at', type: 'number', isOptional: true },
          ],
        },
      ],
    },
  ],
});

// Configure SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Use JSI if available (not available in Expo Go)
  jsi: false, // Set to false for Expo Go compatibility
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
    VisitAttachment,
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
