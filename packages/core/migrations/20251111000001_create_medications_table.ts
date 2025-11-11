import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create medications table for medication orders
  await knex.schema.createTable('medications', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization and client references
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Medication identification
    table.string('medication_name', 200).notNullable(); // Brand name
    table.string('generic_name', 200); // Generic name

    // Dosage information
    table.string('dosage', 100).notNullable(); // e.g., "10mg", "2 tablets", "5ml"
    table.enum('route', ['ORAL', 'TOPICAL', 'INJECTION', 'INHALATION', 'OTHER']).notNullable();
    table.string('frequency', 100).notNullable(); // e.g., "BID", "TID", "QD", "PRN"
    table.text('instructions'); // Special instructions

    // Prescriber information
    table.string('prescribed_by', 200).notNullable(); // Prescriber name
    table.date('prescribed_date').notNullable();
    table.date('start_date').notNullable();
    table.date('end_date'); // Null = ongoing

    // Status and refills
    table.enum('status', ['ACTIVE', 'DISCONTINUED', 'ON_HOLD']).notNullable().defaultTo('ACTIVE');
    table.integer('refills_remaining');

    // Safety information
    table.jsonb('side_effects').defaultTo('[]'); // Array of side effects to monitor
    table.jsonb('warnings').defaultTo('[]'); // Array of warnings

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_medications_org_id ON medications(organization_id)');
  await knex.raw('CREATE INDEX idx_medications_client_id ON medications(client_id)');
  await knex.raw('CREATE INDEX idx_medications_status ON medications(status) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_medications_client_status ON medications(client_id, status)');
  await knex.raw('CREATE INDEX idx_medications_dates ON medications(start_date, end_date)');

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_medications_updated_at
      BEFORE UPDATE ON medications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE medications IS 'Medication orders for clients with prescriber information and safety data'");
  await knex.raw("COMMENT ON COLUMN medications.frequency IS 'Medication frequency using standard abbreviations (BID, TID, QD, PRN, etc.)'");
  await knex.raw("COMMENT ON COLUMN medications.side_effects IS 'JSON array of common side effects to monitor'");
  await knex.raw("COMMENT ON COLUMN medications.warnings IS 'JSON array of important warnings (e.g., drug interactions, food restrictions)'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_medications_updated_at ON medications');
  await knex.schema.dropTableIfExists('medications');
}
