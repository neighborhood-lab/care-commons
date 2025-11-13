import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create medication_administrations table for MAR (Medication Administration Record)
  await knex.schema.createTable('medication_administrations', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // References
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('medication_id').notNullable().references('id').inTable('medications').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Administration details
    table.uuid('administered_by').notNullable().references('id').inTable('users'); // Caregiver who administered
    table.timestamp('administered_at').notNullable(); // Actual administration time
    table.timestamp('scheduled_for'); // Scheduled time (if applicable)

    // Dosage and route (captured at time of administration)
    table.string('dosage_given', 100).notNullable();
    table.enum('route', ['ORAL', 'TOPICAL', 'INJECTION', 'INHALATION', 'OTHER']).notNullable();

    // Administration status
    table.enum('status', ['GIVEN', 'REFUSED', 'HELD', 'MISSED']).notNullable();
    table.text('notes'); // General administration notes
    table.text('refusal_reason'); // If status = REFUSED
    table.text('hold_reason'); // If status = HELD

    // Witness (for controlled substances or high-risk medications)
    table.uuid('witnessed_by').references('id').inTable('users');

    // Audit fields (no updated_at - administrations are immutable)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_med_admin_org_id ON medication_administrations(organization_id)');
  await knex.raw('CREATE INDEX idx_med_admin_medication_id ON medication_administrations(medication_id)');
  await knex.raw('CREATE INDEX idx_med_admin_client_id ON medication_administrations(client_id)');
  await knex.raw('CREATE INDEX idx_med_admin_administered_by ON medication_administrations(administered_by)');
  await knex.raw('CREATE INDEX idx_med_admin_administered_at ON medication_administrations(administered_at DESC)');
  await knex.raw('CREATE INDEX idx_med_admin_status ON medication_administrations(status)');
  await knex.raw('CREATE INDEX idx_med_admin_client_time ON medication_administrations(client_id, administered_at DESC)');
  await knex.raw('CREATE INDEX idx_med_admin_medication_time ON medication_administrations(medication_id, administered_at DESC)');

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE medication_administrations IS 'Medication Administration Record (MAR) - immutable log of all medication administration events'");
  await knex.raw("COMMENT ON COLUMN medication_administrations.administered_at IS 'Actual timestamp when medication was administered (or refused/held)'");
  await knex.raw("COMMENT ON COLUMN medication_administrations.scheduled_for IS 'Originally scheduled time (null for PRN medications)'");
  await knex.raw("COMMENT ON COLUMN medication_administrations.status IS 'GIVEN = successfully administered, REFUSED = client refused, HELD = held by clinical decision, MISSED = not given when scheduled'");
  await knex.raw("COMMENT ON COLUMN medication_administrations.witnessed_by IS 'Required witness for controlled substances or high-risk medications per state regulations'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('medication_administrations');
}
