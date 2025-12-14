/**
 * Create orders table
 *
 * Tracks and manages physician orders for home health clients.
 * Supports order lifecycle from receipt through completion.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('physician_id').references('id').inTable('physicians');

    // Order type and category
    table
      .enum('order_type', [
        'MEDICATION',
        'LAB_TEST',
        'DIAGNOSTIC',
        'THERAPY',
        'DME',
        'SUPPLIES',
        'REFERRAL',
        'DIET',
        'ACTIVITY',
        'WOUND_CARE',
        'VITAL_SIGNS',
        'NURSING_INTERVENTION',
        'OTHER',
      ])
      .notNullable();
    table
      .enum('priority', ['ROUTINE', 'URGENT', 'STAT'])
      .notNullable()
      .defaultTo('ROUTINE');

    // Order details
    table.string('order_number', 50); // External order number if applicable
    table.text('order_description').notNullable();
    table.text('order_details'); // Detailed instructions, dosing, frequency, etc.
    table.string('icd10_codes', 200); // Comma-separated diagnosis codes
    table.text('clinical_indication'); // Why the order was placed

    // Timing
    table.date('order_date').notNullable();
    table.date('start_date');
    table.date('end_date');
    table.string('frequency', 100); // e.g., "Daily", "BID", "Weekly", "PRN"
    table.string('duration', 100); // e.g., "30 days", "Until healed", "Ongoing"

    // Source of order
    table
      .enum('order_source', [
        'PHYSICIAN_OFFICE',
        'HOSPITAL_DISCHARGE',
        'PHONE_ORDER',
        'FAX',
        'PORTAL',
        'FACE_TO_FACE',
        'VERBAL',
        'COMMUNICATION',
        'OTHER',
      ])
      .notNullable();
    table.uuid('communication_id').references('id').inTable('physician_communications');
    table.text('source_details'); // Additional context about source

    // Ordering physician
    table.string('ordering_physician_name', 200).notNullable();
    table.string('ordering_physician_npi', 10);
    table.string('ordering_physician_phone', 20);

    // Status tracking
    table
      .enum('status', [
        'PENDING_VERIFICATION',
        'VERIFIED',
        'ACKNOWLEDGED',
        'IN_PROGRESS',
        'COMPLETED',
        'DISCONTINUED',
        'ON_HOLD',
        'CANCELLED',
        'EXPIRED',
      ])
      .notNullable()
      .defaultTo('PENDING_VERIFICATION');
    table.text('status_reason'); // Reason for status change

    // Verification (required for verbal/phone orders)
    table.boolean('requires_cosignature').notNullable().defaultTo(false);
    table.boolean('is_verified').notNullable().defaultTo(false);
    table.uuid('verified_by').references('id').inTable('users');
    table.string('verified_by_name', 200);
    table.timestamp('verified_at');
    table.text('verification_notes');

    // Physician signature (for verbal orders)
    table.boolean('requires_physician_signature').notNullable().defaultTo(false);
    table.boolean('physician_signed').defaultTo(false);
    table.timestamp('physician_signed_at');
    table.text('signature_method'); // e.g., "Fax returned", "Portal signature"

    // Entry information
    table.uuid('entered_by').notNullable().references('id').inTable('users');
    table.string('entered_by_name', 200).notNullable();
    table.timestamp('entered_at').notNullable().defaultTo(knex.fn.now());

    // Implementation tracking
    table.uuid('assigned_to').references('id').inTable('users');
    table.string('assigned_to_name', 200);
    table.timestamp('acknowledged_at');
    table.uuid('acknowledged_by').references('id').inTable('users');
    table.string('acknowledged_by_name', 200);
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.uuid('completed_by').references('id').inTable('users');
    table.string('completed_by_name', 200);
    table.text('completion_notes');

    // Discontinuation
    table.timestamp('discontinued_at');
    table.uuid('discontinued_by').references('id').inTable('users');
    table.string('discontinued_by_name', 200);
    table.text('discontinuation_reason');

    // Related entities
    table.uuid('related_visit_id').references('id').inTable('visits');
    table.uuid('medication_id').references('id').inTable('medications');
    // NOTE: care_plan_tasks table not yet created, will add FK constraint when available
    table.uuid('care_plan_task_id');

    // Clinical notes
    table.text('clinical_notes');
    table.text('implementation_notes');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'client_id']);
    table.index(['client_id', 'status']);
    table.index(['client_id', 'order_type']);
    table.index(['physician_id']);
    table.index(['status', 'organization_id']);
    table.index(['order_date']);
    table.index(['priority', 'status']);
  });

  // Order history/audit trail
  await knex.schema.createTable('order_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');

    table
      .enum('action', [
        'CREATED',
        'VERIFIED',
        'ACKNOWLEDGED',
        'STARTED',
        'UPDATED',
        'COMPLETED',
        'DISCONTINUED',
        'CANCELLED',
        'ON_HOLD',
        'RESUMED',
        'EXPIRED',
        'NOTE_ADDED',
      ])
      .notNullable();
    table.text('details'); // Details about the action
    table.jsonb('changes'); // JSON of field changes

    table.uuid('performed_by').notNullable().references('id').inTable('users');
    table.string('performed_by_name', 200).notNullable();
    table.timestamp('performed_at').notNullable().defaultTo(knex.fn.now());

    table.index(['order_id', 'performed_at']);
  });

  // Order sets (templates for common order combinations)
  await knex.schema.createTable('order_sets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    table.string('name', 200).notNullable();
    table.text('description');
    table.string('category', 100); // e.g., "Post-Hospital", "Wound Care", "CHF Management"
    table.jsonb('orders').notNullable(); // Array of order templates

    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('display_order').defaultTo(0);

    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['organization_id', 'category']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_history');
  await knex.schema.dropTableIfExists('order_sets');
  await knex.schema.dropTableIfExists('orders');
}
