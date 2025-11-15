/**
 * Migration: Add signature capture to visit_notes
 *
 * Adds fields for capturing client/family acknowledgment signatures
 * on visit notes for compliance and audit purposes.
 *
 * FEATURES:
 * - Multiple signature types (client, family member, caregiver)
 * - Base64-encoded signature image data
 * - Signature metadata (timestamp, device, IP address)
 * - PDF/image URL storage for permanent records
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('visit_notes', (table) => {
    // Signature requirement flag (already exists in visits table, but needed here too)
    table.boolean('requires_signature').notNullable().defaultTo(false);

    // Caregiver signature (always required)
    table.boolean('caregiver_signed').notNullable().defaultTo(false);
    table.text('caregiver_signature_data').nullable(); // Base64 encoded signature
    table.string('caregiver_signature_url', 500).nullable(); // Permanent URL (S3, etc.)
    table.timestamp('caregiver_signed_at').nullable();
    table.string('caregiver_signature_device', 200).nullable(); // Device info
    table.string('caregiver_signature_ip', 45).nullable(); // IPv4 or IPv6

    // Client/family signature (optional, for acknowledgment)
    table.boolean('client_signed').notNullable().defaultTo(false);
    table.text('client_signature_data').nullable(); // Base64 encoded signature
    table.string('client_signature_url', 500).nullable(); // Permanent URL
    table.timestamp('client_signed_at').nullable();
    table.string('client_signer_name', 200).nullable(); // Name of person who signed
    table.enum('client_signer_relationship', [
      'SELF',              // Client signed themselves
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'LEGAL_GUARDIAN',
      'POWER_OF_ATTORNEY',
      'OTHER'
    ]).nullable();
    table.string('client_signature_device', 200).nullable();
    table.string('client_signature_ip', 45).nullable();

    // Supervisor signature (for incident reports or required reviews)
    table.boolean('supervisor_signed').notNullable().defaultTo(false);
    table.uuid('supervisor_signed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('supervisor_signature_data').nullable();
    table.string('supervisor_signature_url', 500).nullable();
    table.timestamp('supervisor_signed_at').nullable();
    table.text('supervisor_comments').nullable();
  });

  // Add indexes for signature queries
  await knex.raw(`
    CREATE INDEX idx_visit_notes_caregiver_signed ON visit_notes(caregiver_signed);
  `);

  await knex.raw(`
    CREATE INDEX idx_visit_notes_client_signed ON visit_notes(client_signed);
  `);

  await knex.raw(`
    CREATE INDEX idx_visit_notes_supervisor_signed ON visit_notes(supervisor_signed);
  `);

  await knex.raw(`
    CREATE INDEX idx_visit_notes_requires_signature ON visit_notes(requires_signature)
    WHERE requires_signature = true AND (caregiver_signed = false OR client_signed = false);
  `);

  // Add comments
  await knex.raw(`
    COMMENT ON COLUMN visit_notes.caregiver_signature_data IS
    'Base64-encoded signature image data (SVG or PNG). Used for immediate display before permanent storage.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN visit_notes.caregiver_signature_url IS
    'Permanent URL to signature image stored in S3/blob storage. Used for long-term records.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN visit_notes.client_signer_relationship IS
    'Relationship of the person who signed on behalf of the client (if not self).';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_visit_notes_requires_signature');
  await knex.raw('DROP INDEX IF EXISTS idx_visit_notes_supervisor_signed');
  await knex.raw('DROP INDEX IF EXISTS idx_visit_notes_client_signed');
  await knex.raw('DROP INDEX IF EXISTS idx_visit_notes_caregiver_signed');

  await knex.schema.alterTable('visit_notes', (table) => {
    table.dropColumn('requires_signature');
    table.dropColumn('caregiver_signed');
    table.dropColumn('caregiver_signature_data');
    table.dropColumn('caregiver_signature_url');
    table.dropColumn('caregiver_signed_at');
    table.dropColumn('caregiver_signature_device');
    table.dropColumn('caregiver_signature_ip');
    table.dropColumn('client_signed');
    table.dropColumn('client_signature_data');
    table.dropColumn('client_signature_url');
    table.dropColumn('client_signed_at');
    table.dropColumn('client_signer_name');
    table.dropColumn('client_signer_relationship');
    table.dropColumn('client_signature_device');
    table.dropColumn('client_signature_ip');
    table.dropColumn('supervisor_signed');
    table.dropColumn('supervisor_signed_by');
    table.dropColumn('supervisor_signature_data');
    table.dropColumn('supervisor_signature_url');
    table.dropColumn('supervisor_signed_at');
    table.dropColumn('supervisor_comments');
  });
}
