/**
 * Migration: Create clinical_visit_notes table
 * 
 * Clinical documentation for skilled nursing and therapy visits.
 * Supports SOAP format, clinical signatures, and regulatory compliance.
 * 
 * DIFFERENTIATION FROM visit_notes:
 * - visit_notes: General caregiver documentation (HHA, personal care)
 * - clinical_visit_notes: Licensed clinical staff documentation (RN, PT, OT, ST)
 * 
 * REGULATORY COMPLIANCE:
 * - Medicare Conditions of Participation (42 CFR 484)
 * - State nursing board documentation requirements
 * - HIPAA audit trail requirements
 * - Co-signature requirements (LVN notes require RN co-sign in some states)
 * 
 * FEATURES:
 * - SOAP format (Subjective, Objective, Assessment, Plan)
 * - Clinical staff signatures with credentials
 * - Supervision and co-signature workflow
 * - Amendment tracking with audit trail
 * - Field-level encryption flags for PHI
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('clinical_visit_notes', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign keys
    table.uuid('visit_id').notNullable().references('id').inTable('visits').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
    
    // Note metadata
    table.enum('note_type', [
      'SKILLED_NURSING',      // RN visit note
      'HOME_HEALTH_AIDE',     // HHA visit note
      'PHYSICAL_THERAPY',     // PT visit note
      'OCCUPATIONAL_THERAPY', // OT visit note
      'SPEECH_THERAPY',       // ST visit note
      'SOCIAL_WORK',          // MSW visit note
      'SUPERVISION',          // Supervisory visit
      'DISCHARGE_SUMMARY'     // Final visit summary
    ]).notNullable();
    table.date('service_date').notNullable();
    table.timestamp('documented_at').defaultTo(knex.fn.now()).notNullable();
    
    // SOAP format - Structured clinical documentation
    table.text('subjective_notes').nullable(); // Patient's reported symptoms, concerns
    table.text('objective_notes').nullable();  // Observable findings, measurements
    table.text('assessment').nullable();       // Clinical judgment, diagnosis
    table.text('plan').nullable();             // Care plan, interventions, follow-up
    
    // Alternative: Free-text narrative
    table.text('narrative_note').nullable();
    
    // Structured data
    table.jsonb('interventions_performed').nullable().defaultTo('[]'); // Array of intervention strings
    table.enum('patient_response', [
      'TOLERATED_WELL',
      'MILD_DISCOMFORT',
      'MODERATE_DISTRESS',
      'SEVERE_REACTION',
      'UNABLE_TO_ASSESS'
    ]).nullable();
    table.boolean('safety_incidents').notNullable().defaultTo(false);
    table.text('incident_description').nullable();
    
    // Clinical staff signature
    table.uuid('signed_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('signed_by_name', 200).notNullable();
    table.string('signed_by_credentials', 50).notNullable(); // RN, LVN, PT, OT, ST
    table.timestamp('signed_at').notNullable();
    
    // Supervision (if required)
    table.uuid('supervised_by').nullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('supervised_by_name', 200).nullable();
    table.string('supervised_by_credentials', 50).nullable();
    table.timestamp('supervised_at').nullable();
    
    // Status
    table.enum('status', [
      'DRAFT',
      'PENDING_SIGNATURE',
      'SIGNED',
      'PENDING_COSIGN',
      'FINALIZED',
      'AMENDED',
      'LOCKED'
    ]).notNullable().defaultTo('DRAFT');
    
    // Co-signature workflow (LVN notes require RN co-sign in some states)
    table.boolean('requires_co_sign').notNullable().defaultTo(false);
    table.uuid('co_signed_by').nullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('co_signed_by_name', 200).nullable();
    table.timestamp('co_signed_at').nullable();
    
    // Amendment tracking
    table.text('amendment_reason').nullable();
    table.timestamp('amended_at').nullable();
    table.uuid('amended_by').nullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('original_note_id').nullable().references('id').inTable('clinical_visit_notes').onDelete('RESTRICT');
    
    // Encryption flags (HIPAA field-level encryption)
    table.boolean('is_encrypted').notNullable().defaultTo(false);
    table.jsonb('encrypted_fields').nullable(); // Array of field names that are encrypted
    
    // Soft delete
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('updated_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.integer('version').notNullable().defaultTo(1);

    // Indexes for performance
    table.index('visit_id');
    table.index('organization_id');
    table.index('branch_id');
    table.index('client_id');
    table.index('caregiver_id');
    table.index('service_date');
    table.index('note_type');
    table.index('status');
    table.index(['requires_co_sign', 'status']); // Find notes pending co-signature
    table.index('signed_by');
    table.index('created_at');
    table.index('deleted_at');
  });

  // Create updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_clinical_visit_notes_updated_at
    BEFORE UPDATE ON clinical_visit_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comments for documentation
  await knex.raw(`
    COMMENT ON TABLE clinical_visit_notes IS 
    'Clinical documentation for skilled nursing and therapy visits. Licensed clinical staff only (RN, LVN, PT, OT, ST).';
  `);

  await knex.raw(`
    COMMENT ON COLUMN clinical_visit_notes.subjective_notes IS 
    'SOAP: Subjective - Patient''s reported symptoms, concerns, and complaints.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN clinical_visit_notes.objective_notes IS 
    'SOAP: Objective - Observable findings, vital signs, physical examination results.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN clinical_visit_notes.assessment IS 
    'SOAP: Assessment - Clinical judgment, diagnosis, and evaluation of patient status.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN clinical_visit_notes.plan IS 
    'SOAP: Plan - Care plan updates, interventions, follow-up actions, and next steps.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN clinical_visit_notes.requires_co_sign IS 
    'State-specific: LVN notes require RN co-signature in some states (e.g., California).';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_clinical_visit_notes_updated_at ON clinical_visit_notes');
  await knex.schema.dropTableIfExists('clinical_visit_notes');
}
