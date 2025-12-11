/**
 * Create physician communication table
 *
 * Supports secure messaging between clinical staff and physicians
 * for patient care coordination.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Physicians table - external providers associated with clients
  await knex.schema.createTable('physicians', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('credentials', 50); // MD, DO, NP, PA
    table.string('specialty', 100);
    table.string('npi', 10); // National Provider Identifier

    // Contact information
    table.string('phone', 20);
    table.string('fax', 20);
    table.string('email', 200);
    table.string('secure_email', 200); // For HIPAA-compliant messaging

    // Practice information
    table.string('practice_name', 200);
    table.string('address_line1', 200);
    table.string('address_line2', 200);
    table.string('city', 100);
    table.string('state', 2);
    table.string('zip', 10);

    // Preferred contact method
    table
      .enum('preferred_contact', ['PHONE', 'FAX', 'EMAIL', 'SECURE_MESSAGE', 'PORTAL'])
      .notNullable()
      .defaultTo('PHONE');

    // Communication preferences
    table.boolean('accepts_secure_messages').notNullable().defaultTo(false);
    table.string('portal_url', 500); // External EHR portal URL if applicable
    table.text('contact_notes'); // Special instructions for contacting

    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['organization_id', 'last_name']);
    table.index(['npi']);
  });

  // Client-Physician relationships
  await knex.schema.createTable('client_physicians', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('physician_id').notNullable().references('id').inTable('physicians');

    table
      .enum('relationship_type', [
        'PRIMARY_CARE',
        'SPECIALIST',
        'HOSPITALIST',
        'SURGEON',
        'PSYCHIATRIST',
        'OTHER',
      ])
      .notNullable()
      .defaultTo('PRIMARY_CARE');
    table.string('specialty_notes', 200); // e.g., "Cardiologist", "Wound Care"

    table.boolean('is_primary').notNullable().defaultTo(false);
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['client_id', 'physician_id']);
    table.index(['client_id', 'is_primary']);
  });

  // Physician communications/messages
  await knex.schema.createTable('physician_communications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('physician_id').notNullable().references('id').inTable('physicians');
    table.uuid('visit_id').references('id').inTable('visits');

    // Communication type and urgency
    table
      .enum('communication_type', [
        'ORDER_REQUEST',
        'STATUS_UPDATE',
        'ABNORMAL_FINDING',
        'MEDICATION_QUESTION',
        'CARE_PLAN_CHANGE',
        'WOUND_UPDATE',
        'VITAL_SIGN_ALERT',
        'LAB_RESULT_NOTIFICATION',
        'GENERAL_INQUIRY',
        'OTHER',
      ])
      .notNullable();
    table
      .enum('urgency', ['ROUTINE', 'URGENT', 'STAT'])
      .notNullable()
      .defaultTo('ROUTINE');

    // Communication content
    table.string('subject', 300).notNullable();
    table.text('message').notNullable();

    // Clinical context
    table.text('clinical_context'); // Brief patient status summary
    table.jsonb('attachments'); // Array of attachment references

    // Contact method used
    table
      .enum('contact_method', ['PHONE', 'FAX', 'EMAIL', 'SECURE_MESSAGE', 'PORTAL', 'IN_PERSON'])
      .notNullable();
    table.text('contact_notes'); // Details about the contact attempt

    // Sender information
    table.uuid('sent_by').notNullable().references('id').inTable('users');
    table.string('sent_by_name', 200).notNullable();
    table.string('sent_by_credentials', 50);
    table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());

    // Delivery status
    table
      .enum('status', [
        'DRAFT',
        'SENT',
        'DELIVERED',
        'READ',
        'RESPONSE_RECEIVED',
        'FAILED',
        'CANCELLED',
      ])
      .notNullable()
      .defaultTo('DRAFT');
    table.timestamp('delivered_at');
    table.timestamp('read_at');

    // Response tracking
    table.boolean('requires_response').notNullable().defaultTo(true);
    table.timestamp('response_due_by');
    table.text('physician_response');
    table.timestamp('response_received_at');
    table.string('responded_via', 100); // How the response was received

    // Follow-up
    table.boolean('requires_follow_up').notNullable().defaultTo(false);
    table.text('follow_up_notes');
    table.uuid('follow_up_by').references('id').inTable('users');
    table.string('follow_up_by_name', 200);
    table.timestamp('follow_up_completed_at');

    // Related orders
    table.text('orders_received'); // Orders received from physician
    table.boolean('orders_entered').defaultTo(false);
    table.timestamp('orders_entered_at');
    table.uuid('orders_entered_by').references('id').inTable('users');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'client_id']);
    table.index(['client_id', 'physician_id']);
    table.index(['status', 'requires_response']);
    table.index(['urgency', 'organization_id']);
    table.index(['sent_at']);
  });

  // Communication templates
  await knex.schema.createTable('physician_communication_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    table.string('name', 200).notNullable();
    table
      .enum('communication_type', [
        'ORDER_REQUEST',
        'STATUS_UPDATE',
        'ABNORMAL_FINDING',
        'MEDICATION_QUESTION',
        'CARE_PLAN_CHANGE',
        'WOUND_UPDATE',
        'VITAL_SIGN_ALERT',
        'LAB_RESULT_NOTIFICATION',
        'GENERAL_INQUIRY',
        'OTHER',
      ])
      .notNullable();
    table.string('subject_template', 300).notNullable();
    table.text('message_template').notNullable();

    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('display_order').defaultTo(0);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['organization_id', 'communication_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('physician_communication_templates');
  await knex.schema.dropTableIfExists('physician_communications');
  await knex.schema.dropTableIfExists('client_physicians');
  await knex.schema.dropTableIfExists('physicians');
}
