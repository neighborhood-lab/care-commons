"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('care_plans', (table) => {
        table.string('state_jurisdiction', 2).nullable();
        table.jsonb('state_specific_data').defaultTo('{}');
        table.string('order_source', 100).nullable();
        table.uuid('ordering_provider_id').references('id').inTable('users');
        table.string('ordering_provider_name', 255);
        table.string('ordering_provider_license', 100);
        table.string('ordering_provider_npi', 20);
        table.timestamp('order_date');
        table.uuid('verbal_order_authenticated_by').references('id').inTable('users');
        table.timestamp('verbal_order_authenticated_at');
        table.uuid('rn_delegation_id');
        table.uuid('rn_supervisor_id').references('id').inTable('users');
        table.string('rn_supervisor_name', 255);
        table.string('rn_supervisor_license', 100);
        table.date('last_supervisory_visit_date');
        table.date('next_supervisory_visit_due');
        table.integer('plan_review_interval_days').defaultTo(60);
        table.date('next_review_due');
        table.date('last_review_completed_date');
        table.uuid('last_review_completed_by').references('id').inTable('users');
        table.string('medicaid_program', 100);
        table.string('medicaid_waiver', 100);
        table.string('service_authorization_form', 100);
        table.decimal('service_authorization_units', 7, 2);
        table.date('service_authorization_period_start');
        table.date('service_authorization_period_end');
        table.boolean('is_cds_model').defaultTo(false);
        table.uuid('employer_authority_id');
        table.uuid('financial_management_service_id');
        table.string('plan_of_care_form_number', 50);
        table.boolean('disaster_plan_on_file').defaultTo(false);
        table.boolean('infection_control_plan_reviewed').defaultTo(false);
    });
    await knex.raw(`
    CREATE INDEX idx_care_plans_state_jurisdiction 
    ON care_plans(state_jurisdiction) WHERE deleted_at IS NULL
  `);
    await knex.raw(`
    CREATE INDEX idx_care_plans_review_due 
    ON care_plans(next_review_due) WHERE deleted_at IS NULL AND next_review_due IS NOT NULL
  `);
    await knex.raw(`
    CREATE INDEX idx_care_plans_supervisory_visit_due 
    ON care_plans(next_supervisory_visit_due) WHERE deleted_at IS NULL AND next_supervisory_visit_due IS NOT NULL
  `);
    await knex.raw(`
    CREATE INDEX idx_care_plans_medicaid_program 
    ON care_plans(medicaid_program) WHERE deleted_at IS NULL AND medicaid_program IS NOT NULL
  `);
    await knex.raw(`
    CREATE INDEX idx_care_plans_state_specific_data_gin 
    ON care_plans USING gin(state_specific_data)
  `);
    await knex.schema.alterTable('task_instances', (table) => {
        table.boolean('requires_supervision').defaultTo(false);
        table.boolean('supervisor_review_required').defaultTo(false);
        table.uuid('supervisor_reviewed_by').references('id').inTable('users');
        table.timestamp('supervisor_reviewed_at');
        table.uuid('delegation_authority_id');
        table.string('skill_level_required', 50);
        table.jsonb('state_specific_task_data').defaultTo('{}');
    });
    await knex.schema.alterTable('service_authorizations', (table) => {
        table.uuid('care_plan_id').references('id').inTable('care_plans').onDelete('CASCADE');
    });
    await knex.raw(`
    CREATE INDEX idx_task_instances_supervision_required 
    ON task_instances(requires_supervision) WHERE requires_supervision = TRUE
  `);
    await knex.raw(`
    CREATE INDEX idx_task_instances_supervisor_review 
    ON task_instances(supervisor_review_required, supervisor_reviewed_at) 
    WHERE supervisor_review_required = TRUE AND supervisor_reviewed_at IS NULL
  `);
    await knex.raw(`
    CREATE INDEX idx_task_instances_state_specific_data_gin 
    ON task_instances USING gin(state_specific_task_data)
  `);
    await knex.schema.alterTable('service_authorizations', (table) => {
        table.string('state_jurisdiction', 2);
        table.specificType('service_codes', 'text[]');
        table.decimal('units_used', 10, 2).defaultTo(0);
        table.jsonb('state_specific_data').defaultTo('{}');
    });
    await knex.raw(`
    ALTER TABLE service_authorizations
    ADD COLUMN units_remaining DECIMAL(10, 2) GENERATED ALWAYS AS (authorized_units - units_used) STORED
  `);
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
    await knex.schema.createTable('rn_delegations', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('care_plan_id').notNullable().references('id').inTable('care_plans').onDelete('CASCADE');
        table.uuid('client_id').notNullable().references('id').inTable('clients');
        table.uuid('organization_id').notNullable().references('id').inTable('organizations');
        table.uuid('branch_id').references('id').inTable('branches');
        table.uuid('delegating_rn_id').notNullable().references('id').inTable('users');
        table.string('delegating_rn_name', 255).notNullable();
        table.string('delegating_rn_license', 100).notNullable();
        table.uuid('delegated_to_caregiver_id').references('id').inTable('caregivers');
        table.string('delegated_to_caregiver_name', 255).notNullable();
        table.string('delegated_to_credential_type', 50).notNullable();
        table.string('delegated_to_credential_number', 100);
        table.string('task_category', 50).notNullable();
        table.text('task_description').notNullable();
        table.specificType('specific_skills_delegated', 'text[]').notNullable();
        table.specificType('limitations', 'text[]');
        table.boolean('training_provided').notNullable().defaultTo(false);
        table.date('training_date');
        table.string('training_method', 100);
        table.boolean('competency_evaluated').notNullable().defaultTo(false);
        table.date('competency_evaluation_date');
        table.uuid('competency_evaluator_id').references('id').inTable('users');
        table.string('evaluation_result', 50);
        table.date('effective_date').notNullable();
        table.date('expiration_date');
        table.string('supervision_frequency', 100);
        table.date('last_supervision_date');
        table.date('next_supervision_due');
        table.string('status', 50).notNullable().defaultTo('ACTIVE');
        table.text('revocation_reason');
        table.uuid('revoked_by').references('id').inTable('users');
        table.timestamp('revoked_at');
        table.string('ahca_delegation_form_number', 50);
        table.jsonb('state_specific_data').defaultTo('{}');
        table.text('notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable().references('id').inTable('users');
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable().references('id').inTable('users');
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by').references('id').inTable('users');
    });
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
async function down(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS rn_delegations_updated_at ON rn_delegations');
    await knex.raw('DROP FUNCTION IF EXISTS update_rn_delegations_updated_at()');
    await knex.raw('DROP TRIGGER IF EXISTS service_authorizations_updated_at ON service_authorizations');
    await knex.raw('DROP FUNCTION IF EXISTS update_service_authorizations_updated_at()');
    await knex.schema.dropTableIfExists('rn_delegations');
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
    await knex.schema.alterTable('service_authorizations', (table) => {
        table.dropColumn('state_specific_data');
        table.dropColumn('units_remaining');
        table.dropColumn('units_used');
        table.dropColumn('service_codes');
        table.dropColumn('state_jurisdiction');
        table.dropColumn('care_plan_id');
    });
    await knex.schema.alterTable('task_instances', (table) => {
        table.dropColumn('state_specific_task_data');
        table.dropColumn('skill_level_required');
        table.dropColumn('delegation_authority_id');
        table.dropColumn('supervisor_reviewed_at');
        table.dropColumn('supervisor_reviewed_by');
        table.dropColumn('supervisor_review_required');
        table.dropColumn('requires_supervision');
    });
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
//# sourceMappingURL=20251030214721_state_specific_care_plans.js.map