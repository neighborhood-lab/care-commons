/**
 * Migration: Create visit_notes table
 * 
 * Stores caregiver notes documenting visit activities, client condition,
 * and incidents. Required for compliance and care continuity.
 * 
 * Features:
 * - Rich text notes with templates
 * - Activity tracking (checkboxes)
 * - Client mood/condition assessment
 * - Incident flagging
 * - Voice-to-text support
 * - Audit trail (cannot modify after 24 hours)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('visit_notes', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign keys
    table.uuid('visit_id').notNullable().references('id').inTable('visits').onDelete('CASCADE');
    table.uuid('evv_record_id').nullable().references('id').inTable('evv_records').onDelete('SET NULL');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
   
    // Note details
    table.enum('note_type', ['GENERAL', 'CLINICAL', 'INCIDENT', 'TASK']).notNullable().defaultTo('GENERAL');
    table.text('note_text').notNullable();
    table.text('note_html').nullable(); // Rich text formatted version
    table.uuid('template_id').nullable(); // Reference to note template used
    
    // Activities performed (JSONB array of activity IDs/names)
    table.jsonb('activities_performed').nullable().defaultTo('[]');
    
    // Client assessment
    table.enum('client_mood', [
      'EXCELLENT',
      'GOOD',
      'FAIR',
      'POOR',
      'DISTRESSED',
      'UNRESPONSIVE'
    ]).nullable();
    table.text('client_condition_notes').nullable();
    
    // Incident tracking
    table.boolean('is_incident').notNullable().defaultTo(false);
    table.enum('incident_severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable();
    table.text('incident_description').nullable();
    table.timestamp('incident_reported_at').nullable();
    
    // Voice-to-text
    table.boolean('is_voice_note').notNullable().defaultTo(false);
    table.string('audio_file_uri', 500).nullable(); // S3 URL
    table.decimal('transcription_confidence', 5, 4).nullable(); // 0.0000 to 1.0000
    
    // Compliance and audit
    table.boolean('is_locked').notNullable().defaultTo(false); // Locked after 24 hours
    table.timestamp('locked_at').nullable();
    table.uuid('locked_by').nullable(); // User who locked (system or admin)
    table.text('lock_reason').nullable(); // Audit requirement, manual override, etc.
    
    // Sync tracking (for mobile offline support)
    table.boolean('is_synced').notNullable().defaultTo(false);
    table.boolean('sync_pending').notNullable().defaultTo(true);
    table.timestamp('synced_at').nullable();
    
    // Soft delete
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('updated_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    // Indexes
    table.index('visit_id'); // Most common query: get notes for a visit
    table.index('caregiver_id'); // Get all notes by caregiver
    table.index('organization_id'); // Org-scoped queries
    table.index('created_at'); // Chronological queries
    table.index(['is_incident', 'incident_severity']); // Incident reporting
    table.index('sync_pending'); // Offline sync queue
    table.index('deleted_at'); // Soft delete queries
  });

  // Create updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_visit_notes_updated_at
    BEFORE UPDATE ON visit_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create function to auto-lock notes after 24 hours
  await knex.raw(`
    CREATE OR REPLACE FUNCTION auto_lock_visit_notes()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Lock notes older than 24 hours
      IF NEW.created_at < NOW() - INTERVAL '24 hours' AND OLD.is_locked = FALSE THEN
        NEW.is_locked = TRUE;
        NEW.locked_at = NOW();
        NEW.locked_by = '00000000-0000-0000-0000-000000000000'::uuid; -- System user
        NEW.lock_reason = 'Automatic lock after 24 hours (compliance requirement)';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_auto_lock_visit_notes
    BEFORE UPDATE ON visit_notes
    FOR EACH ROW
    EXECUTE FUNCTION auto_lock_visit_notes();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS trigger_auto_lock_visit_notes ON visit_notes');
  await knex.raw('DROP FUNCTION IF EXISTS auto_lock_visit_notes()');
  await knex.raw('DROP TRIGGER IF EXISTS update_visit_notes_updated_at ON visit_notes');
  await knex.schema.dropTableIfExists('visit_notes');
}
