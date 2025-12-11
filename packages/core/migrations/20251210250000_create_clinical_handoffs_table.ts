/**
 * Create clinical handoffs table
 *
 * Supports structured clinical handoffs (SBAR, I-PASS) between nurses/caregivers.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('clinical_handoffs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').notNullable().references('id').inTable('branches');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Participants
    table.uuid('from_caregiver_id').notNullable().references('id').inTable('users');
    table.uuid('to_caregiver_id').notNullable().references('id').inTable('users');

    // Handoff details
    table.enum('handoff_type', ['SBAR', 'I_PASS', 'GENERAL']).notNullable();
    table.enum('urgency', ['ROUTINE', 'URGENT', 'CRITICAL']).notNullable().defaultTo('ROUTINE');
    table.text('handoff_reason').notNullable();
    table.date('effective_date').notNullable();

    // Structured content (JSON)
    table.jsonb('sbar_content'); // { situation, background, assessment, recommendation }
    table.jsonb('ipass_content'); // { illnessSeverity, patientSummary, actionList, situationAwareness, synthesis }
    table.text('general_notes');

    // Key information arrays
    table.specificType('critical_alerts', 'text[]').defaultTo('{}');
    table.specificType('pending_tasks', 'text[]').defaultTo('{}');
    table.specificType('medication_changes', 'text[]');
    table.specificType('upcoming_appointments', 'text[]');

    // Status tracking
    table
      .enum('status', ['DRAFT', 'PENDING_ACKNOWLEDGMENT', 'ACKNOWLEDGED', 'DECLINED', 'EXPIRED'])
      .notNullable()
      .defaultTo('DRAFT');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('sent_at');
    table.timestamp('acknowledged_at');
    table.text('acknowledgment_notes');
    table.timestamp('declined_at');
    table.text('decline_reason');

    // Related records
    table.uuid('related_visit_id').references('id').inTable('visits');
    table.specificType('related_note_ids', 'uuid[]');

    // Indexes
    table.index(['organization_id', 'status']);
    table.index(['to_caregiver_id', 'status']);
    table.index(['client_id', 'effective_date']);
    table.index(['from_caregiver_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('clinical_handoffs');
}
