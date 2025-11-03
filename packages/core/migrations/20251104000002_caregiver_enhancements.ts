import type { Knex } from 'knex';

/**
 * Caregiver enhancements migration
 * 
 * Adds state-specific compliance fields to support:
 * - Texas: Employee Misconduct Registry, Nurse Aide Registry, EVV enrollment
 * - Florida: Level 2 Background Screening, AHCA compliance
 * - Service authorizations for EVV eligibility checking
 * - State registry screening workflow
 */
export async function up(knex: Knex): Promise<void> {
  // Add state-specific data column (if not exists)
  const hasColumn = await knex.schema.hasColumn('caregivers', 'state_specific');
  if (!hasColumn) {
    await knex.schema.alterTable('caregivers', (table) => {
      table.jsonb('state_specific');
    });
  }

  // Create caregiver service authorizations table
  await knex.schema.createTable('caregiver_service_authorizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
    table.string('service_type_code', 50).notNullable(); // e.g., 'PERSONAL_CARE', 'COMPANION'
    table.string('service_type_name', 255).notNullable();
    table.string('authorization_source', 100); // 'CREDENTIAL', 'TRAINING', 'MANUAL'
    table.date('effective_date').notNullable().defaultTo(knex.fn.now());
    table.date('expiration_date');
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.text('notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    
    // Constraints
    table.unique(['caregiver_id', 'service_type_code']);
    table.check(`status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')`);
  });

  // Create state screening records table (for TX/FL registry checks)
  await knex.schema.createTable('caregiver_state_screenings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
    table.string('state_code', 2).notNullable(); // 'TX', 'FL'
    table.string('screening_type', 100).notNullable(); // 'EMPLOYEE_MISCONDUCT_REGISTRY', 'LEVEL_2_BACKGROUND'
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.date('initiation_date').notNullable().defaultTo(knex.fn.now());
    table.date('completion_date');
    table.date('expiration_date');
    table.string('confirmation_number', 100);
    table.string('clearance_number', 100);
    table.jsonb('results'); // Screening results/details
    table.text('notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    
    // Constraints
    table.check(`state_code IN ('TX', 'FL', 'CA', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT', 'IA', 'NV', 'AR', 'MS', 'KS', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH', 'ME', 'RI', 'MT', 'DE', 'SD', 'ND', 'AK', 'VT', 'WY', 'DC')`);
    table.check(`status IN ('PENDING', 'IN_PROGRESS', 'CLEARED', 'CONDITIONAL', 'FLAGGED', 'DISQUALIFIED', 'EXPIRED')`);
  });

  // Indexes for service authorizations
  await knex.raw('CREATE INDEX idx_caregiver_service_auths_caregiver ON caregiver_service_authorizations(caregiver_id) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_caregiver_service_auths_service_type ON caregiver_service_authorizations(service_type_code)');
  await knex.raw('CREATE INDEX idx_caregiver_service_auths_status ON caregiver_service_authorizations(status)');
  await knex.raw('CREATE INDEX idx_caregiver_service_auths_expiring ON caregiver_service_authorizations(expiration_date) WHERE expiration_date IS NOT NULL AND status = \'ACTIVE\'');

  // Indexes for state screenings
  await knex.raw('CREATE INDEX idx_caregiver_state_screenings_caregiver ON caregiver_state_screenings(caregiver_id)');
  await knex.raw('CREATE INDEX idx_caregiver_state_screenings_state ON caregiver_state_screenings(state_code, screening_type)');
  await knex.raw('CREATE INDEX idx_caregiver_state_screenings_status ON caregiver_state_screenings(status)');
  await knex.raw('CREATE INDEX idx_caregiver_state_screenings_expiring ON caregiver_state_screenings(expiration_date) WHERE expiration_date IS NOT NULL');

  // JSONB index for state-specific data
  await knex.raw('CREATE INDEX idx_caregivers_state_specific ON caregivers USING gin(state_specific)');

  // Trigger for service authorizations updated_at
  await knex.raw(`
    CREATE TRIGGER update_caregiver_service_authorizations_updated_at 
      BEFORE UPDATE ON caregiver_service_authorizations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Trigger for state screenings updated_at
  await knex.raw(`
    CREATE TRIGGER update_caregiver_state_screenings_updated_at 
      BEFORE UPDATE ON caregiver_state_screenings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments
  await knex.raw("COMMENT ON TABLE caregiver_service_authorizations IS 'Service types that caregiver is authorized to provide'");
  await knex.raw("COMMENT ON TABLE caregiver_state_screenings IS 'State-specific background screenings and registry checks'");
  await knex.raw("COMMENT ON COLUMN caregivers.state_specific IS 'State-specific compliance data (TX/FL requirements)'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_caregiver_state_screenings_updated_at ON caregiver_state_screenings');
  await knex.raw('DROP TRIGGER IF EXISTS update_caregiver_service_authorizations_updated_at ON caregiver_service_authorizations');
  await knex.schema.dropTableIfExists('caregiver_state_screenings');
  await knex.schema.dropTableIfExists('caregiver_service_authorizations');
  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumn('state_specific');
  });
}
