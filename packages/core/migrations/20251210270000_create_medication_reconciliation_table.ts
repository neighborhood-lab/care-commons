/**
 * Create medication reconciliation table
 *
 * Tracks medication reconciliation performed during home visits.
 * Required for nursing documentation and patient safety.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('medication_reconciliations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('visit_id').references('id').inTable('visits');

    // Reconciliation performed by
    table.uuid('performed_by').notNullable().references('id').inTable('users');
    table.string('performed_by_name', 200).notNullable();
    table.string('performed_by_credentials', 50); // RN, LVN, etc.
    table.timestamp('performed_at').notNullable().defaultTo(knex.fn.now());

    // Source of information
    table
      .enum('information_source', [
        'PATIENT',
        'FAMILY_MEMBER',
        'CAREGIVER',
        'PHARMACY',
        'PHYSICIAN_OFFICE',
        'HOSPITAL_DISCHARGE',
        'OTHER',
      ])
      .notNullable()
      .defaultTo('PATIENT');
    table.string('source_details', 200); // Name of person/pharmacy if applicable

    // Reconciliation status
    table
      .enum('status', ['IN_PROGRESS', 'COMPLETED', 'REQUIRES_FOLLOWUP', 'SIGNED'])
      .notNullable()
      .defaultTo('IN_PROGRESS');

    // Overall findings
    table.boolean('has_discrepancies').notNullable().defaultTo(false);
    table.integer('discrepancy_count').notNullable().defaultTo(0);
    table.text('summary_notes'); // Overall summary of reconciliation

    // Patient adherence assessment
    table.enum('adherence_assessment', ['GOOD', 'FAIR', 'POOR', 'UNABLE_TO_ASSESS']);
    table.text('adherence_notes'); // Notes about barriers, concerns

    // Signature
    table.uuid('signed_by').references('id').inTable('users');
    table.string('signed_by_name', 200);
    table.timestamp('signed_at');

    // Follow-up
    table.boolean('requires_physician_notification').notNullable().defaultTo(false);
    table.boolean('physician_notified').defaultTo(false);
    table.timestamp('physician_notified_at');
    table.text('physician_notification_notes');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['organization_id', 'client_id']);
    table.index(['client_id', 'performed_at']);
    table.index(['visit_id']);
    table.index(['status', 'organization_id']);
  });

  // Medication reconciliation items - individual medications reviewed
  await knex.schema.createTable('medication_reconciliation_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reconciliation_id')
      .notNullable()
      .references('id')
      .inTable('medication_reconciliations')
      .onDelete('CASCADE');
    table.uuid('medication_id').references('id').inTable('medications'); // Null for new meds not in system

    // Medication details (captured at time of reconciliation)
    table.string('medication_name', 200).notNullable();
    table.string('dosage', 100);
    table.string('frequency', 100);
    table.string('route', 50);
    table.text('instructions');
    table.string('prescriber', 200);

    // Reconciliation status for this medication
    table
      .enum('item_status', [
        'CONFIRMED', // Matches documented, patient taking as prescribed
        'NEW', // Patient taking but not documented in system
        'DISCONTINUED', // In system but patient no longer taking
        'DOSAGE_CHANGED', // Dosage different from documented
        'FREQUENCY_CHANGED', // Frequency different from documented
        'NOT_TAKING', // Patient not taking as prescribed
        'PRN_TAKING', // Patient taking PRN medication
        'UNKNOWN', // Unable to verify
      ])
      .notNullable();

    // Documented vs reported values (for tracking discrepancies)
    table.string('documented_dosage', 100);
    table.string('documented_frequency', 100);
    table.string('reported_dosage', 100);
    table.string('reported_frequency', 100);

    // Additional details
    table.text('notes'); // Notes about this medication
    table.text('reason_for_change'); // Why patient made changes
    table.boolean('patient_understands_purpose').defaultTo(true);
    table.boolean('has_supply').defaultTo(true); // Patient has supply
    table.integer('days_supply_remaining');

    // Action required
    table.boolean('requires_action').notNullable().defaultTo(false);
    table.text('action_required'); // What action is needed
    table.boolean('action_completed').defaultTo(false);
    table.timestamp('action_completed_at');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['reconciliation_id']);
    table.index(['medication_id']);
    table.index(['item_status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('medication_reconciliation_items');
  await knex.schema.dropTableIfExists('medication_reconciliations');
}
