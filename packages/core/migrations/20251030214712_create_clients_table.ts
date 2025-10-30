import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Clients table
  await knex.schema.createTable('clients', (table) => {
    // Primary key and organization
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').notNullable().references('id').inTable('branches');
    
    // Identity
    table.string('client_number', 50).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('last_name', 100).notNullable();
    table.string('preferred_name', 100);
    table.date('date_of_birth').notNullable();
    table.string('ssn', 255); // Encrypted
    table.string('gender', 50);
    table.string('pronouns', 50);
    
    // Contact information
    table.jsonb('primary_phone');
    table.jsonb('alternate_phone');
    table.string('email', 255);
    table.string('preferred_contact_method', 50);
    table.jsonb('communication_preferences');
    
    // Demographics
    table.string('language', 50);
    table.string('ethnicity', 100);
    table.jsonb('race');
    table.string('marital_status', 50);
    table.boolean('veteran_status').defaultTo(false);
    
    // Residence
    table.jsonb('primary_address').notNullable();
    table.jsonb('secondary_addresses');
    table.jsonb('living_arrangement');
    table.jsonb('mobility_info');
    
    // Contacts
    table.jsonb('emergency_contacts').notNullable().defaultTo('[]');
    table.jsonb('authorized_contacts').notNullable().defaultTo('[]');
    
    // Healthcare
    table.jsonb('primary_physician');
    table.jsonb('pharmacy');
    table.jsonb('insurance');
    table.string('medical_record_number', 100);
    
    // Service information
    table.jsonb('programs').notNullable().defaultTo('[]');
    table.jsonb('service_eligibility').notNullable();
    table.jsonb('funding_sources');
    
    // Risk and safety
    table.jsonb('risk_flags').notNullable().defaultTo('[]');
    table.jsonb('allergies');
    table.text('special_instructions');
    table.text('access_instructions');
    
    // Status
    table.string('status', 50).notNullable().defaultTo('PENDING_INTAKE');
    table.date('intake_date');
    table.date('discharge_date');
    table.text('discharge_reason');
    
    // Metadata
    table.string('referral_source', 255);
    table.text('notes');
    table.jsonb('custom_fields');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');
    
    // Constraints
    table.unique(['organization_id', 'client_number']);
    table.check(`status IN ('INQUIRY', 'PENDING_INTAKE', 'ACTIVE', 'INACTIVE', 'ON_HOLD', 'DISCHARGED', 'DECEASED')`);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_clients_organization ON clients(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_clients_branch ON clients(branch_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_clients_status ON clients(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_clients_client_number ON clients(client_number) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_clients_name ON clients(last_name, first_name) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_clients_dob ON clients(date_of_birth) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_clients_intake_date ON clients(intake_date) WHERE deleted_at IS NULL');

  // Full-text search index
  await knex.raw(`
    CREATE INDEX idx_clients_search ON clients USING gin(
      to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(client_number, '')
      )
    ) WHERE deleted_at IS NULL
  `);

  // JSONB indexes for querying embedded data
  await knex.raw('CREATE INDEX idx_clients_primary_address ON clients USING gin(primary_address)');
  await knex.raw('CREATE INDEX idx_clients_risk_flags ON clients USING gin(risk_flags)');
  await knex.raw('CREATE INDEX idx_clients_programs ON clients USING gin(programs)');

  // Function to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_clients_updated_at 
      BEFORE UPDATE ON clients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE clients IS 'Individuals receiving care services'");
  await knex.raw("COMMENT ON COLUMN clients.client_number IS 'Human-readable unique identifier'");
  await knex.raw("COMMENT ON COLUMN clients.ssn IS 'Social Security Number (encrypted)'");
  await knex.raw("COMMENT ON COLUMN clients.primary_address IS 'Primary residence address (JSONB)'");
  await knex.raw("COMMENT ON COLUMN clients.emergency_contacts IS 'Emergency contact list (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN clients.authorized_contacts IS 'Authorized contacts with permissions (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN clients.risk_flags IS 'Safety and care risk flags (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN clients.service_eligibility IS 'Insurance and program eligibility (JSONB)'");
  await knex.raw("COMMENT ON COLUMN clients.programs IS 'Program enrollments (JSONB array)'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_clients_updated_at ON clients');
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
  await knex.schema.dropTableIfExists('clients');
}