import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add state-specific fields to care_plans table
  await knex.schema.alterTable('care_plans', (table) => {
    table.string('state_jurisdiction', 2).nullable(); // Two-letter state code
    table.jsonb('state_specific_data').defaultTo('{}');
    table.string('order_source', 100).nullable(); // TX: Physician/authorized professional
    table.uuid('ordering_provider_id').references('id').inTable('users');
    table.string('ordering_provider_name', 255);
    table.string('ordering_provider_license', 100);
    table.string('ordering_provider_npi', 20);
    table.timestamp('order_date');
    table.uuid('verbal_order_authenticated_by').references('id').inTable('users');
    table.timestamp('verbal_order_authenticated_at');
    table.uuid('rn_delegation_id'); // FL: RN delegation per 59A-8.0216
    table.uuid('rn_supervisor_id').references('id').inTable('users');
    table.string('rn_supervisor_name', 255);
    table.string('rn_supervisor_license', 100);
    table.date('last_supervisory_visit_date');
    table.date('next_supervisory_visit_due');
    table.integer('plan_review_interval_days').defaultTo(60); // TX/FL: 60-90 day reviews
    table.date('next_review_due');
    table.date('last_review_completed_date');
    table.uuid('last_review_completed_by').references('id').inTable('users');
    table.string('medicaid_program', 100); // TX: STAR+Plus, Community First Choice, etc.
    table.string('medicaid_waiver', 100); // TX/FL: Waiver program if applicable
    table.string('service_authorization_form', 100); // TX: HHSC Form 4100 series
    table.decimal('service_authorization_units', 7, 2); // Hours or units authorized
    table.date('service_authorization_period_start');
    table.date('service_authorization_period_end');
    table.boolean('is_cds_model').defaultTo(false); // TX: Consumer Directed Services
    table.uuid('employer_authority_id'); // TX CDS: Who manages caregivers
    table.uuid('financial_management_service_id'); // TX CDS: FMS provider
    table.string('plan_of_care_form_number', 50); // TX Form 485, FL AHCA Form 484
    table.boolean('disaster_plan_on_file').defaultTo(false); // TX: §558 Emergency Preparedness
    table.boolean('infection_control_plan_reviewed').defaultTo(false);
  });

  // Create index for state jurisdiction queries
  await knex.raw(`
    CREATE INDEX idx_care_plans_state_jurisdiction 
    ON care_plans(state_jurisdiction) WHERE deleted_at IS NULL
  `);

  // Create index for review due dates
  await knex.raw(`
    CREATE INDEX idx_care_plans_review_due 
    ON care_plans(next_review_due) WHERE deleted_at IS NULL AND next_review_due IS NOT NULL
  `);

  // Create index for supervisory visit tracking
  await knex.raw(`
    CREATE INDEX idx_care_plans_supervisory_visit_due 
    ON care_plans(next_supervisory_visit_due) WHERE deleted_at IS NULL AND next_supervisory_visit_due IS NOT NULL
  `);

  // Create index for Medicaid program tracking
  await knex.raw(`
    CREATE INDEX idx_care_plans_medicaid_program 
    ON care_plans(medicaid_program) WHERE deleted_at IS NULL AND medicaid_program IS NOT NULL
  `);

  // Create GIN index for state-specific data JSONB
  await knex.raw(`
    CREATE INDEX idx_care_plans_state_specific_data_gin 
    ON care_plans USING gin(state_specific_data)
  `);

  // Add state-specific task tracking
  await knex.schema.alterTable('task_instances', (table) => {
    table.boolean('requires_supervision').defaultTo(false); // FL: RN oversight required
    table.boolean('supervisor_review_required').defaultTo(false);
    table.uuid('supervisor_reviewed_by').references('id').inTable('users');
    table.timestamp('supervisor_reviewed_at');
    table.uuid('delegation_authority_id'); // FL: RN delegation record
    table.string('skill_level_required', 50); // CNA, HHA, RN, LPN, etc.
    table.jsonb('state_specific_task_data').defaultTo('{}');
  });

  // Add care_plan_id to existing service_authorizations table
  await knex.schema.alterTable('service_authorizations', (table) => {
    table.uuid('care_plan_id').references('id').inTable('care_plans').onDelete('CASCADE');
  });

  // Create index for tasks requiring supervision
  await knex.raw(`
    CREATE INDEX idx_task_instances_supervision_required 
    ON task_instances(requires_supervision) WHERE requires_supervision = TRUE
  `);

  // Create index for tasks needing supervisor review
  await knex.raw(`
    CREATE INDEX idx_task_instances_supervisor_review 
    ON task_instances(supervisor_review_required, supervisor_reviewed_at) 
    WHERE supervisor_review_required = TRUE AND supervisor_reviewed_at IS NULL
  `);

  // Create GIN index for state-specific task data
  await knex.raw(`
    CREATE INDEX idx_task_instances_state_specific_data_gin 
    ON task_instances USING gin(state_specific_task_data)
  `);

  // Add state-specific columns to existing service_authorizations table
  await knex.schema.alterTable('service_authorizations', (table) => {
    table.string('state_jurisdiction', 2);
    table.specificType('service_codes', 'text[]'); // Procedure codes
    table.decimal('units_used', 10, 2).defaultTo(0);
    table.jsonb('state_specific_data').defaultTo('{}');
  });

  // Add generated column for units_remaining (PostgreSQL specific)
  await knex.raw(`
    ALTER TABLE service_authorizations
    ADD COLUMN units_remaining DECIMAL(10, 2) GENERATED ALWAYS AS (authorized_units - units_used) STORED
  `);

  // Indexes for service_authorizations
  await knex.raw(`
    CREATE INDEX idx_service_authorizations_care_plan 
    ON service_authorizations(care_plan_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_service_authorizations_client 
    ON service_authorizations(client_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_service_authorizations_organization 
    ON service_authorizations(organization_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_service_authorizations_status 
    ON service_authorizations(status) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_service_authorizations_expiring 
    ON service_authorizations(effective_to) WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  await knex.raw(`
    CREATE INDEX idx_service_authorizations_state 
    ON service_authorizations(state_jurisdiction) WHERE deleted_at IS NULL
  `);

  // Trigger for service_authorizations updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_service_authorizations_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        
        -- Auto-calculate units_remaining
        NEW.units_remaining = NEW.authorized_units - COALESCE(NEW.units_used, 0);
        
        -- Auto-update status based on expiration
        IF NEW.expiration_date < CURRENT_DATE THEN
            NEW.status = 'EXPIRED';
        ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' AND NEW.status = 'ACTIVE' THEN
            NEW.status = 'EXPIRING_SOON';
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER service_authorizations_updated_at
        BEFORE UPDATE ON service_authorizations
        FOR EACH ROW
        EXECUTE FUNCTION update_service_authorizations_updated_at()
  `);

  // Add RN delegation tracking for FL (59A-8.0216)
  await knex.schema.createTable('rn_delegations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Core identifiers
    table
      .uuid('care_plan_id')
      .notNullable()
      .references('id')
      .inTable('care_plans')
      .onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');

    // Delegation details
    table.uuid('delegating_rn_id').notNullable().references('id').inTable('users'); // Must be RN
    table.string('delegating_rn_name', 255).notNullable();
    table.string('delegating_rn_license', 100).notNullable();

    table.uuid('delegated_to_caregiver_id').references('id').inTable('caregivers'); // CNA, HHA, etc.
    table.string('delegated_to_caregiver_name', 255).notNullable();
    table.string('delegated_to_credential_type', 50).notNullable(); // CNA, HHA, etc.
    table.string('delegated_to_credential_number', 100);

    // Scope of delegation
    table.string('task_category', 50).notNullable(); // MEDICATION, WOUND_CARE, etc.
    table.text('task_description').notNullable();
    table.specificType('specific_skills_delegated', 'text[]').notNullable();
    table.specificType('limitations', 'text[]');

    // Training and competency
    table.boolean('training_provided').notNullable().defaultTo(false);
    table.date('training_date');
    table.string('training_method', 100); // In-person, virtual, etc.
    table.boolean('competency_evaluated').notNullable().defaultTo(false);
    table.date('competency_evaluation_date');
    table.uuid('competency_evaluator_id').references('id').inTable('users');
    table.string('evaluation_result', 50);

    // Period and supervision
    table.date('effective_date').notNullable();
    table.date('expiration_date');
    table.string('supervision_frequency', 100); // Daily, Weekly, Per Visit, etc.
    table.date('last_supervision_date');
    table.date('next_supervision_due');

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.text('revocation_reason');
    table.uuid('revoked_by').references('id').inTable('users');
    table.timestamp('revoked_at');

    // FL-specific
    table.string('ahca_delegation_form_number', 50);
    table.jsonb('state_specific_data').defaultTo('{}');

    // Metadata
    table.text('notes');

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');
  });

  // Add constraints to rn_delegations
  await knex.raw(`
    ALTER TABLE rn_delegations
    ADD CONSTRAINT chk_evaluation_result CHECK (evaluation_result IN (
        'COMPETENT', 'NEEDS_IMPROVEMENT', 'NOT_COMPETENT', 'PENDING'
    ))
  `);

  await knex.raw(`
    ALTER TABLE rn_delegations
    ADD CONSTRAINT chk_status CHECK (status IN (
        'PENDING_TRAINING', 'PENDING_EVALUATION', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE rn_delegations
    ADD CONSTRAINT valid_delegation_period CHECK (
        expiration_date IS NULL OR expiration_date > effective_date
    )
  `);

  // Indexes for rn_delegations
  await knex.raw(`
    CREATE INDEX idx_rn_delegations_care_plan 
    ON rn_delegations(care_plan_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_rn_delegations_client 
    ON rn_delegations(client_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_rn_delegations_rn 
    ON rn_delegations(delegating_rn_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_rn_delegations_caregiver 
    ON rn_delegations(delegated_to_caregiver_id) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_rn_delegations_status 
    ON rn_delegations(status) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_rn_delegations_supervision_due 
    ON rn_delegations(next_supervision_due) WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  await knex.raw(`
    CREATE INDEX idx_rn_delegations_task_category 
    ON rn_delegations(task_category) WHERE deleted_at IS NULL
  `);

  // Trigger for rn_delegations updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_rn_delegations_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        
        -- Auto-update status based on expiration
        IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE AND NEW.status = 'ACTIVE' THEN
            NEW.status = 'EXPIRED';
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER rn_delegations_updated_at
        BEFORE UPDATE ON rn_delegations
        FOR EACH ROW
        EXECUTE FUNCTION update_rn_delegations_updated_at()
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS rn_delegations_updated_at ON rn_delegations');
  await knex.raw('DROP FUNCTION IF EXISTS update_rn_delegations_updated_at()');

  await knex.raw(
    'DROP TRIGGER IF EXISTS service_authorizations_updated_at ON service_authorizations'
  );
  await knex.raw('DROP FUNCTION IF EXISTS update_service_authorizations_updated_at()');

  // Drop tables
  await knex.schema.dropTableIfExists('rn_delegations');

  // Drop indexes
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_state_specific_data_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_supervisor_review');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_supervision_required');
  await knex.raw('DROP INDEX IF EXISTS idx_service_authorizations_state');
  await knex.raw('DROP INDEX IF EXISTS idx_service_authorizations_expiring');
  await knex.raw('DROP INDEX IF EXISTS idx_service_authorizations_status');
  await knex.raw('DROP INDEX IF EXISTS idx_service_authorizations_organization');
  await knex.raw('DROP INDEX IF EXISTS idx_service_authorizations_client');
  await knex.raw('DROP INDEX IF EXISTS idx_service_authorizations_care_plan');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_state_specific_data_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_medicaid_program');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_supervisory_visit_due');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_review_due');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_state_jurisdiction');

  // Remove state-specific columns from service_authorizations
  await knex.schema.alterTable('service_authorizations', (table) => {
    table.dropColumn('state_specific_data');
    table.dropColumn('units_remaining');
    table.dropColumn('units_used');
    table.dropColumn('service_codes');
    table.dropColumn('state_jurisdiction');
    table.dropColumn('care_plan_id');
  });

  // Remove state-specific columns from task_instances
  await knex.schema.alterTable('task_instances', (table) => {
    table.dropColumn('state_specific_task_data');
    table.dropColumn('skill_level_required');
    table.dropColumn('delegation_authority_id');
    table.dropColumn('supervisor_reviewed_at');
    table.dropColumn('supervisor_reviewed_by');
    table.dropColumn('supervisor_review_required');
    table.dropColumn('requires_supervision');
  });

  // Remove state-specific columns from care_plans
  await knex.schema.alterTable('care_plans', (table) => {
    table.dropColumn('infection_control_plan_reviewed');
    table.dropColumn('disaster_plan_on_file');
    table.dropColumn('plan_of_care_form_number');
    table.dropColumn('financial_management_service_id');
    table.dropColumn('employer_authority_id');
    table.dropColumn('is_cds_model');
    table.dropColumn('service_authorization_period_end');
    table.dropColumn('service_authorization_period_start');
    table.dropColumn('service_authorization_units');
    table.dropColumn('service_authorization_form');
    table.dropColumn('medicaid_waiver');
    table.dropColumn('medicaid_program');
    table.dropColumn('last_review_completed_by');
    table.dropColumn('last_review_completed_date');
    table.dropColumn('next_review_due');
    table.dropColumn('plan_review_interval_days');
    table.dropColumn('next_supervisory_visit_due');
    table.dropColumn('last_supervisory_visit_date');
    table.dropColumn('rn_supervisor_license');
    table.dropColumn('rn_supervisor_name');
    table.dropColumn('rn_supervisor_id');
    table.dropColumn('rn_delegation_id');
    table.dropColumn('verbal_order_authenticated_at');
    table.dropColumn('verbal_order_authenticated_by');
    table.dropColumn('order_date');
    table.dropColumn('ordering_provider_npi');
    table.dropColumn('ordering_provider_license');
    table.dropColumn('ordering_provider_name');
    table.dropColumn('ordering_provider_id');
    table.dropColumn('order_source');
    table.dropColumn('state_specific_data');
    table.dropColumn('state_jurisdiction');
  });
}
