import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Caregivers table
  await knex.schema.createTable('caregivers', (table) => {
    // Primary key and organization
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.specificType('branch_ids', 'UUID[]').notNullable().defaultTo('{}');
    table.uuid('primary_branch_id').notNullable().references('id').inTable('branches');
    
    // Identity
    table.string('employee_number', 50).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('last_name', 100).notNullable();
    table.string('preferred_name', 100);
    table.date('date_of_birth').notNullable();
    table.string('ssn', 255); // Encrypted
    table.string('gender', 50);
    table.string('pronouns', 50);
    
    // Contact information
    table.jsonb('primary_phone').notNullable();
    table.jsonb('alternate_phone');
    table.string('email', 255).notNullable();
    table.string('preferred_contact_method', 50).notNullable().defaultTo('PHONE');
    table.jsonb('communication_preferences');
    
    // Demographics
    table.string('language', 50);
    table.specificType('languages', 'VARCHAR(50)[]').defaultTo('{}');
    table.string('ethnicity', 100);
    table.specificType('race', 'VARCHAR(100)[]').defaultTo('{}');
    
    // Address
    table.jsonb('primary_address').notNullable();
    table.jsonb('mailing_address');
    
    // Emergency contacts
    table.jsonb('emergency_contacts').notNullable().defaultTo('[]');
    
    // Employment information
    table.string('employment_type', 50).notNullable();
    table.string('employment_status', 50).notNullable().defaultTo('ACTIVE');
    table.date('hire_date').notNullable();
    table.date('termination_date');
    table.text('termination_reason');
    table.boolean('rehire_eligible');
    
    // Role and permissions
    table.string('role', 100).notNullable();
    table.specificType('permissions', 'VARCHAR(100)[]').defaultTo('{}');
    table.uuid('supervisor_id').references('id').inTable('caregivers');
    
    // Credentials and compliance
    table.jsonb('credentials').notNullable().defaultTo('[]');
    table.jsonb('background_check');
    table.jsonb('drug_screening');
    table.jsonb('health_screening');
    
    // Training and qualifications
    table.jsonb('training').notNullable().defaultTo('[]');
    table.jsonb('skills').notNullable().defaultTo('[]');
    table.specificType('specializations', 'VARCHAR(100)[]').defaultTo('{}');
    
    // Availability and preferences
    table.jsonb('availability').notNullable();
    table.jsonb('work_preferences');
    table.integer('max_hours_per_week');
    table.integer('min_hours_per_week');
    table.boolean('willing_to_travel').defaultTo(false);
    table.integer('max_travel_distance'); // miles
    
    // Compensation
    table.jsonb('pay_rate').notNullable();
    table.jsonb('alternate_pay_rates');
    table.jsonb('payroll_info');
    
    // Performance and compliance
    table.decimal('performance_rating', 2, 1);
    table.date('last_review_date');
    table.date('next_review_date');
    table.string('compliance_status', 50).notNullable().defaultTo('PENDING_VERIFICATION');
    table.timestamp('last_compliance_check');
    
    // Scheduling metadata
    table.decimal('reliability_score', 3, 2);
    table.specificType('preferred_clients', 'UUID[]');
    table.specificType('restricted_clients', 'UUID[]');
    
    // Status
    table.string('status', 50).notNullable().defaultTo('PENDING_ONBOARDING');
    table.text('status_reason');
    
    // Documents
    table.jsonb('documents');
    
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
    
    // Constraints
    table.unique(['organization_id', 'employee_number']);
    table.unique('email');
    table.check(`employment_type IN ('FULL_TIME', 'PART_TIME', 'PER_DIEM', 'CONTRACT', 'TEMPORARY', 'SEASONAL')`);
    table.check(`employment_status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RETIRED')`);
    table.check(`role IN ('CAREGIVER', 'SENIOR_CAREGIVER', 'CERTIFIED_NURSING_ASSISTANT', 'HOME_HEALTH_AIDE', 'PERSONAL_CARE_AIDE', 'COMPANION', 'NURSE_RN', 'NURSE_LPN', 'THERAPIST', 'COORDINATOR', 'SUPERVISOR', 'SCHEDULER', 'ADMINISTRATIVE')`);
    table.check(`status IN ('APPLICATION', 'INTERVIEWING', 'PENDING_ONBOARDING', 'ONBOARDING', 'ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RETIRED')`);
    table.check(`compliance_status IN ('COMPLIANT', 'PENDING_VERIFICATION', 'EXPIRING_SOON', 'EXPIRED', 'NON_COMPLIANT')`);
    table.check(`performance_rating IS NULL OR (performance_rating >= 1.0 AND performance_rating <= 5.0)`);
    table.check(`reliability_score IS NULL OR (reliability_score >= 0.0 AND reliability_score <= 1.0)`);
    table.check(`primary_branch_id = ANY(branch_ids)`);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_caregivers_organization ON caregivers(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_branch ON caregivers USING gin(branch_ids) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_primary_branch ON caregivers(primary_branch_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_status ON caregivers(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_employment_status ON caregivers(employment_status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_compliance_status ON caregivers(compliance_status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_employee_number ON caregivers(employee_number) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_email ON caregivers(email) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_name ON caregivers(last_name, first_name) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_role ON caregivers(role) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_supervisor ON caregivers(supervisor_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_caregivers_hire_date ON caregivers(hire_date) WHERE deleted_at IS NULL');

  // Full-text search index
  await knex.raw(`
    CREATE INDEX idx_caregivers_search ON caregivers USING gin(
      to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(employee_number, '')
      )
    ) WHERE deleted_at IS NULL
  `);

  // JSONB indexes for querying embedded data
  await knex.raw('CREATE INDEX idx_caregivers_credentials ON caregivers USING gin(credentials)');
  await knex.raw('CREATE INDEX idx_caregivers_skills ON caregivers USING gin(skills)');
  await knex.raw('CREATE INDEX idx_caregivers_training ON caregivers USING gin(training)');
  await knex.raw('CREATE INDEX idx_caregivers_availability ON caregivers USING gin(availability)');
  await knex.raw('CREATE INDEX idx_caregivers_languages ON caregivers USING gin(languages)');

  // GIN index for array columns
  await knex.raw('CREATE INDEX idx_caregivers_specializations ON caregivers USING gin(specializations)');
  await knex.raw('CREATE INDEX idx_caregivers_permissions ON caregivers USING gin(permissions)');

  // Partial indexes for common queries
  await knex.raw(`
    CREATE INDEX idx_caregivers_active ON caregivers(id) 
      WHERE deleted_at IS NULL AND status = 'ACTIVE' AND compliance_status = 'COMPLIANT'
  `);
  await knex.raw(`
    CREATE INDEX idx_caregivers_expiring_credentials ON caregivers(id)
      WHERE deleted_at IS NULL AND compliance_status IN ('EXPIRING_SOON', 'EXPIRED')
  `);

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_caregivers_updated_at 
      BEFORE UPDATE ON caregivers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Function to validate credential expiration
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_credential_expiration()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update compliance status if credentials are expiring or expired
      IF NEW.credentials IS NOT NULL THEN
        -- Check for expired credentials
        IF EXISTS (
          SELECT 1 FROM jsonb_array_elements(NEW.credentials) AS cred
          WHERE cred->>'status' = 'ACTIVE'
            AND (cred->>'expirationDate')::date < CURRENT_DATE
        ) THEN
          NEW.compliance_status := 'EXPIRED';
        -- Check for expiring credentials (within 30 days)
        ELSIF EXISTS (
          SELECT 1 FROM jsonb_array_elements(NEW.credentials) AS cred
          WHERE cred->>'status' = 'ACTIVE'
            AND (cred->>'expirationDate')::date <= CURRENT_DATE + INTERVAL '30 days'
            AND (cred->>'expirationDate')::date >= CURRENT_DATE
        ) THEN
          IF NEW.compliance_status = 'COMPLIANT' THEN
            NEW.compliance_status := 'EXPIRING_SOON';
          END IF;
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  // Trigger to check credential expiration on insert/update
  await knex.raw(`
    CREATE TRIGGER check_caregiver_credentials
      BEFORE INSERT OR UPDATE OF credentials ON caregivers
      FOR EACH ROW
      EXECUTE FUNCTION check_credential_expiration()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE caregivers IS 'Personnel providing care services'");
  await knex.raw("COMMENT ON COLUMN caregivers.employee_number IS 'Human-readable unique identifier'");
  await knex.raw("COMMENT ON COLUMN caregivers.ssn IS 'Social Security Number (encrypted)'");
  await knex.raw("COMMENT ON COLUMN caregivers.branch_ids IS 'Branches where caregiver can work'");
  await knex.raw("COMMENT ON COLUMN caregivers.primary_branch_id IS 'Primary branch assignment'");
  await knex.raw("COMMENT ON COLUMN caregivers.credentials IS 'Certifications and licenses (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN caregivers.background_check IS 'Background check record (JSONB)'");
  await knex.raw("COMMENT ON COLUMN caregivers.drug_screening IS 'Drug screening record (JSONB)'");
  await knex.raw("COMMENT ON COLUMN caregivers.health_screening IS 'Health screening and immunizations (JSONB)'");
  await knex.raw("COMMENT ON COLUMN caregivers.training IS 'Training records (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN caregivers.skills IS 'Skills and proficiency levels (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN caregivers.availability IS 'Weekly availability schedule (JSONB)'");
  await knex.raw("COMMENT ON COLUMN caregivers.work_preferences IS 'Shift and client preferences (JSONB)'");
  await knex.raw("COMMENT ON COLUMN caregivers.pay_rate IS 'Primary pay rate (JSONB)'");
  await knex.raw("COMMENT ON COLUMN caregivers.alternate_pay_rates IS 'Alternative pay rates by service type (JSONB array)'");
  await knex.raw("COMMENT ON COLUMN caregivers.payroll_info IS 'Payroll and banking information (JSONB, encrypted)'");
  await knex.raw("COMMENT ON COLUMN caregivers.compliance_status IS 'Overall compliance status based on credentials and checks'");
  await knex.raw("COMMENT ON COLUMN caregivers.reliability_score IS 'Calculated reliability metric (0.0 to 1.0)'");
  await knex.raw("COMMENT ON COLUMN caregivers.preferred_clients IS 'Client IDs for preferred assignments'");
  await knex.raw("COMMENT ON COLUMN caregivers.restricted_clients IS 'Client IDs that cannot be assigned'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS check_caregiver_credentials ON caregivers');
  await knex.raw('DROP TRIGGER IF EXISTS update_caregivers_updated_at ON caregivers');
  await knex.raw('DROP FUNCTION IF EXISTS check_credential_expiration()');
  await knex.schema.dropTableIfExists('caregivers');
}