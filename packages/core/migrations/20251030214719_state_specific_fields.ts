import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add state-specific field to clients table
  await knex.schema.alterTable('clients', (table) => {
    table.jsonb('state_specific').nullable();
  });

  // Add state-specific field to caregivers table
  await knex.schema.alterTable('caregivers', (table) => {
    table.jsonb('state_specific').nullable();
  });

  // Create indexes for state-specific queries
  await knex.raw('CREATE INDEX idx_clients_state_specific ON clients USING gin(state_specific) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_state_specific ON caregivers USING gin(state_specific) WHERE deleted_at IS NULL');

  // Create audit log table for client record access and disclosure (HIPAA/Texas compliance)
  await knex.schema.createTable('client_access_audit', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('accessed_by').notNullable().references('id').inTable('users');
    table.string('access_type', 50).notNullable(); // 'VIEW', 'UPDATE', 'DISCLOSURE', 'EXPORT'
    table.timestamp('access_timestamp').notNullable().defaultTo(knex.fn.now());
    table.text('access_reason');
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.string('disclosure_recipient', 255); // For DISCLOSURE type
    table.string('disclosure_method', 50); // 'VERBAL', 'WRITTEN', 'ELECTRONIC', 'FAX'
    table.string('authorization_reference', 255);
    table.text('information_disclosed');
    
    // Audit metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Add constraints to client_access_audit
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

  // Indexes for audit log queries
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

  // Create registry check results table for Texas compliance
  await knex.schema.createTable('registry_check_results', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers');
    table.string('registry_type', 50).notNullable(); // 'TX_EMPLOYEE_MISCONDUCT', 'TX_NURSE_AIDE', 'FL_LEVEL2_BACKGROUND'
    table.timestamp('check_date').notNullable();
    table.date('expiration_date');
    table.string('status', 50).notNullable(); // 'CLEAR', 'PENDING', 'LISTED', 'FLAGGED', 'EXPIRED'
    table.string('confirmation_number', 100);
    table.uuid('performed_by').notNullable().references('id').inTable('users');
    
    // Listing details (if flagged)
    table.jsonb('listing_details');
    
    // Documentation
    table.string('document_path', 500);
    table.text('notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
  });

  // Add constraints to registry_check_results
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

  // Indexes for registry checks
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

  // Create plan of care authorization tracking table
  await knex.schema.createTable('client_authorizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.string('authorization_number', 100).notNullable();
    table.string('authorization_type', 50).notNullable(); // 'SERVICE', 'PLAN_OF_CARE', 'MEDICAID', 'INSURANCE'
    
    // Authorization details
    table.string('state', 2); // 'TX', 'FL'
    table.string('authorizing_entity', 255); // HHSC, AHCA, Insurance company
    table.string('authorizing_provider', 255); // Physician/licensed professional
    table.date('authorization_date').notNullable();
    table.date('effective_date').notNullable();
    table.date('expiration_date').notNullable();
    
    // Services and units
    table.jsonb('authorized_services').notNullable().defaultTo('[]');
    table.decimal('total_authorized_units', 10, 2);
    table.decimal('used_units', 10, 2).defaultTo(0);
    table.decimal('remaining_units', 10, 2);
    table.string('unit_type', 50); // 'HOURS', 'VISITS', 'DAYS'
    
    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.text('status_reason');
    
    // Documentation
    table.string('form_number', 100); // e.g., 'HHSC Form 4100', 'AHCA Form 484'
    table.string('document_path', 500);
    
    // Review and renewal
    table.date('last_review_date');
    table.date('next_review_due');
    
    // Metadata
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
  });

  // Add constraints to client_authorizations
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

  // Indexes for authorization tracking
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

  // JSONB index for authorized services
  await knex.raw('CREATE INDEX idx_client_auths_services ON client_authorizations USING gin(authorized_services)');

  // Function to calculate remaining units
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

  // Trigger to automatically calculate remaining units
  await knex.raw(`
    CREATE TRIGGER calculate_authorization_remaining_units
        BEFORE INSERT OR UPDATE OF total_authorized_units, used_units ON client_authorizations
        FOR EACH ROW
        EXECUTE FUNCTION calculate_remaining_units()
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS calculate_authorization_remaining_units ON client_authorizations');
  await knex.raw('DROP FUNCTION IF EXISTS calculate_remaining_units()');
  
  // Drop tables
  await knex.schema.dropTableIfExists('client_authorizations');
  await knex.schema.dropTableIfExists('registry_check_results');
  await knex.schema.dropTableIfExists('client_access_audit');
  
  // Drop indexes
  await knex.raw('DROP INDEX IF EXISTS idx_clients_state_specific');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_state_specific');
  
  // Remove state-specific fields
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('state_specific');
  });
  
  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumn('state_specific');
  });
}