"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('clients', (table) => {
        table.jsonb('state_specific').nullable();
    });
    await knex.schema.alterTable('caregivers', (table) => {
        table.jsonb('state_specific').nullable();
    });
    await knex.raw('CREATE INDEX idx_clients_state_specific ON clients USING gin(state_specific) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_caregivers_state_specific ON caregivers USING gin(state_specific) WHERE deleted_at IS NULL');
    await knex.schema.createTable('client_access_audit', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('client_id').notNullable().references('id').inTable('clients');
        table.uuid('accessed_by').notNullable().references('id').inTable('users');
        table.string('access_type', 50).notNullable();
        table.timestamp('access_timestamp').notNullable().defaultTo(knex.fn.now());
        table.text('access_reason');
        table.specificType('ip_address', 'inet');
        table.text('user_agent');
        table.string('disclosure_recipient', 255);
        table.string('disclosure_method', 50);
        table.string('authorization_reference', 255);
        table.text('information_disclosed');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.raw(`
    ALTER TABLE client_access_audit
    ADD CONSTRAINT valid_access_type CHECK (access_type IN (
        'VIEW', 'UPDATE', 'CREATE', 'DELETE', 'DISCLOSURE', 'EXPORT', 'PRINT'
    ))
  `);
    await knex.raw(`
    ALTER TABLE client_access_audit
    ADD CONSTRAINT valid_disclosure_method CHECK (
        disclosure_method IS NULL OR 
        disclosure_method IN ('VERBAL', 'WRITTEN', 'ELECTRONIC', 'FAX', 'PORTAL')
    )
  `);
    await knex.schema.alterTable('client_access_audit', (table) => {
        table.index('client_id', 'idx_client_access_audit_client');
        table.index('accessed_by', 'idx_client_access_audit_user');
        table.index('access_type', 'idx_client_access_audit_type');
        table.index('access_timestamp', 'idx_client_access_audit_timestamp');
    });
    await knex.raw(`
    CREATE INDEX idx_client_access_audit_disclosure ON client_access_audit(client_id, access_type) 
    WHERE access_type = 'DISCLOSURE'
  `);
    await knex.schema.createTable('registry_check_results', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers');
        table.string('registry_type', 50).notNullable();
        table.timestamp('check_date').notNullable();
        table.date('expiration_date');
        table.string('status', 50).notNullable();
        table.string('confirmation_number', 100);
        table.uuid('performed_by').notNullable().references('id').inTable('users');
        table.jsonb('listing_details');
        table.string('document_path', 500);
        table.text('notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable().references('id').inTable('users');
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable().references('id').inTable('users');
    });
    await knex.raw(`
    ALTER TABLE registry_check_results
    ADD CONSTRAINT valid_registry_type CHECK (registry_type IN (
        'TX_EMPLOYEE_MISCONDUCT',
        'TX_NURSE_AIDE',
        'TX_DPS_FINGERPRINT',
        'FL_LEVEL2_BACKGROUND',
        'FL_AHCA_CLEARINGHOUSE',
        'OTHER'
    ))
  `);
    await knex.raw(`
    ALTER TABLE registry_check_results
    ADD CONSTRAINT valid_check_status CHECK (status IN (
        'CLEAR', 'PENDING', 'LISTED', 'FLAGGED', 'EXPIRED', 'DISQUALIFIED'
    ))
  `);
    await knex.schema.alterTable('registry_check_results', (table) => {
        table.index('caregiver_id', 'idx_registry_checks_caregiver');
        table.index('registry_type', 'idx_registry_checks_type');
        table.index('status', 'idx_registry_checks_status');
        table.index('expiration_date', 'idx_registry_checks_expiration');
        table.index('check_date', 'idx_registry_checks_date');
    });
    await knex.raw(`
    CREATE INDEX idx_registry_checks_expired ON registry_check_results(caregiver_id, registry_type, expiration_date)
    WHERE status = 'EXPIRED'
  `);
    await knex.schema.createTable('client_authorizations', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('client_id').notNullable().references('id').inTable('clients');
        table.string('authorization_number', 100).notNullable();
        table.string('authorization_type', 50).notNullable();
        table.string('state', 2);
        table.string('authorizing_entity', 255);
        table.string('authorizing_provider', 255);
        table.date('authorization_date').notNullable();
        table.date('effective_date').notNullable();
        table.date('expiration_date').notNullable();
        table.jsonb('authorized_services').notNullable().defaultTo('[]');
        table.decimal('total_authorized_units', 10, 2);
        table.decimal('used_units', 10, 2).defaultTo(0);
        table.decimal('remaining_units', 10, 2);
        table.string('unit_type', 50);
        table.string('status', 50).notNullable().defaultTo('ACTIVE');
        table.text('status_reason');
        table.string('form_number', 100);
        table.string('document_path', 500);
        table.date('last_review_date');
        table.date('next_review_due');
        table.text('notes');
        table.jsonb('custom_fields');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable().references('id').inTable('users');
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable().references('id').inTable('users');
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by').references('id').inTable('users');
    });
    await knex.raw(`
    ALTER TABLE client_authorizations
    ADD CONSTRAINT valid_auth_state CHECK (state IN ('TX', 'FL'))
  `);
    await knex.raw(`
    ALTER TABLE client_authorizations
    ADD CONSTRAINT valid_auth_type CHECK (authorization_type IN (
        'SERVICE', 'PLAN_OF_CARE', 'MEDICAID', 'MEDICARE', 'INSURANCE', 'OTHER'
    ))
  `);
    await knex.raw(`
    ALTER TABLE client_authorizations
    ADD CONSTRAINT valid_auth_status CHECK (status IN (
        'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING'
    ))
  `);
    await knex.raw(`
    ALTER TABLE client_authorizations
    ADD CONSTRAINT valid_auth_unit_type CHECK (unit_type IN (
        'HOURS', 'VISITS', 'DAYS', 'UNITS', 'EPISODES'
    ))
  `);
    await knex.raw(`
    ALTER TABLE client_authorizations
    ADD CONSTRAINT valid_date_range CHECK (expiration_date > effective_date)
  `);
    await knex.raw(`
    ALTER TABLE client_authorizations
    ADD CONSTRAINT valid_unit_usage CHECK (
        used_units IS NULL OR 
        total_authorized_units IS NULL OR 
        used_units <= total_authorized_units
    )
  `);
    await knex.schema.alterTable('client_authorizations', (table) => {
        table.index(['client_id'], 'idx_client_auths_client');
        table.index(['status'], 'idx_client_auths_status');
        table.index(['state'], 'idx_client_auths_state');
        table.index(['effective_date'], 'idx_client_auths_effective');
        table.index(['expiration_date'], 'idx_client_auths_expiration');
        table.index(['authorization_number'], 'idx_client_auths_number');
        table.index(['next_review_due'], 'idx_client_auths_review_due');
    });
    await knex.raw(`
    CREATE INDEX idx_client_auths_active ON client_authorizations(client_id, effective_date, expiration_date)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);
    await knex.raw('CREATE INDEX idx_client_auths_services ON client_authorizations USING gin(authorized_services)');
    await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_remaining_units()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.total_authorized_units IS NOT NULL AND NEW.used_units IS NOT NULL THEN
            NEW.remaining_units := NEW.total_authorized_units - NEW.used_units;
        END IF;
        RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);
    await knex.raw(`
    CREATE TRIGGER calculate_authorization_remaining_units
        BEFORE INSERT OR UPDATE OF total_authorized_units, used_units ON client_authorizations
        FOR EACH ROW
        EXECUTE FUNCTION calculate_remaining_units()
  `);
}
async function down(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS calculate_authorization_remaining_units ON client_authorizations');
    await knex.raw('DROP FUNCTION IF EXISTS calculate_remaining_units()');
    await knex.schema.dropTableIfExists('client_authorizations');
    await knex.schema.dropTableIfExists('registry_check_results');
    await knex.schema.dropTableIfExists('client_access_audit');
    await knex.raw('DROP INDEX IF EXISTS idx_clients_state_specific');
    await knex.raw('DROP INDEX IF EXISTS idx_caregivers_state_specific');
    await knex.schema.alterTable('clients', (table) => {
        table.dropColumn('state_specific');
    });
    await knex.schema.alterTable('caregivers', (table) => {
        table.dropColumn('state_specific');
    });
}
//# sourceMappingURL=20251030214719_state_specific_fields.js.map