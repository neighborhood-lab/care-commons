import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Service patterns table
  await knex.schema.createTable('service_patterns', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('client_id').notNullable();

    // Pattern definition
    table.string('name', 200).notNullable();
    table.text('description');
    table.string('pattern_type', 50).notNullable();

    // Service details
    table.uuid('service_type_id').notNullable();
    table.string('service_type_name', 200).notNullable();
    table.jsonb('task_template_ids');

    // Scheduling rules
    table.jsonb('recurrence').notNullable();
    table.integer('duration').notNullable();
    table.integer('flexibility_window');

    // Requirements
    table.jsonb('required_skills');
    table.jsonb('required_certifications');
    table.jsonb('preferred_caregivers');
    table.jsonb('blocked_caregivers');
    table.string('gender_preference', 50);
    table.string('language_preference', 100);

    // Timing preferences
    table.string('preferred_time_of_day', 50);
    table.time('must_start_by');
    table.time('must_end_by');

    // Authorization
    table.decimal('authorized_hours_per_week', 5, 2);
    table.integer('authorized_visits_per_week');
    table.date('authorization_start_date');
    table.date('authorization_end_date');
    table.uuid('funding_source_id');

    // Operational
    table.integer('travel_time_before');
    table.integer('travel_time_after');
    table.boolean('allow_back_to_back').defaultTo(false);

    // Status and lifecycle
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.date('effective_from').notNullable();
    table.date('effective_to');

    // Metadata
    table.text('notes');
    table.text('client_instructions');
    table.text('caregiver_instructions');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Constraints
    table.check(`pattern_type IN ('RECURRING', 'ONE_TIME', 'AS_NEEDED', 'RESPITE')`);
    table.check(`duration BETWEEN 15 AND 1440`);
    table.check(`flexibility_window BETWEEN 0 AND 120`);
    table.check(`gender_preference IN ('MALE', 'FEMALE', 'NO_PREFERENCE')`);
    table.check(
      `preferred_time_of_day IN ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY')`
    );
    table.check(`authorized_hours_per_week BETWEEN 0 AND 168`);
    table.check(`authorized_visits_per_week BETWEEN 0 AND 100`);
    table.check(`travel_time_before BETWEEN 0 AND 120`);
    table.check(`travel_time_after BETWEEN 0 AND 120`);
    table.check(`status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED')`);
    table.check(`effective_to IS NULL OR effective_from <= effective_to`);
    table.check(
      `authorization_end_date IS NULL OR authorization_start_date IS NULL OR authorization_start_date <= authorization_end_date`
    );
    table.check(`must_end_by IS NULL OR must_start_by IS NULL OR must_start_by < must_end_by`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');
  });

  // Indexes for service_patterns
  await knex.raw(
    'CREATE INDEX idx_patterns_organization ON service_patterns(organization_id) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_patterns_branch ON service_patterns(branch_id) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_patterns_client ON service_patterns(client_id) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_patterns_status ON service_patterns(status) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    "CREATE INDEX idx_patterns_active ON service_patterns(client_id, status) WHERE deleted_at IS NULL AND status = 'ACTIVE'"
  );
  await knex.raw(
    'CREATE INDEX idx_patterns_dates ON service_patterns(effective_from, effective_to) WHERE deleted_at IS NULL'
  );

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_patterns_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_patterns_updated_at
      BEFORE UPDATE ON service_patterns
      FOR EACH ROW
      EXECUTE FUNCTION update_patterns_updated_at()
  `);

  // Schedules table
  await knex.schema.createTable('schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('pattern_id').notNullable();

    // Schedule period
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();

    // Generation metadata
    table.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('generated_by').notNullable();
    table.string('generation_method', 50).notNullable();

    // Statistics
    table.integer('total_visits').notNullable().defaultTo(0);
    table.integer('scheduled_visits').notNullable().defaultTo(0);
    table.integer('unassigned_visits').notNullable().defaultTo(0);
    table.integer('completed_visits').notNullable().defaultTo(0);

    // Status
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.text('notes');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`generation_method IN ('AUTO', 'MANUAL', 'IMPORT')`);
    table.check(`status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
    table.check(`start_date <= end_date`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('pattern_id').references('id').inTable('service_patterns');
    table.foreign('generated_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  await knex.raw('CREATE INDEX idx_schedules_pattern ON schedules(pattern_id)');
  await knex.raw('CREATE INDEX idx_schedules_client ON schedules(client_id)');
  await knex.raw('CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date)');
  await knex.raw('CREATE INDEX idx_schedules_status ON schedules(status)');

  // Visits table
  await knex.schema.createTable('visits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('pattern_id');
    table.uuid('schedule_id');

    // Visit identity
    table.string('visit_number', 50).notNullable().unique();
    table.string('visit_type', 50).notNullable();
    table.uuid('service_type_id').notNullable();
    table.string('service_type_name', 200).notNullable();

    // Scheduled timing
    table.date('scheduled_date').notNullable();
    table.time('scheduled_start_time').notNullable();
    table.time('scheduled_end_time').notNullable();
    table.integer('scheduled_duration').notNullable();
    table.string('timezone', 100).notNullable().defaultTo('America/New_York');

    // Actual timing
    table.timestamp('actual_start_time');
    table.timestamp('actual_end_time');
    table.integer('actual_duration');

    // Assignment
    table.uuid('assigned_caregiver_id');
    table.timestamp('assigned_at');
    table.uuid('assigned_by');
    table.string('assignment_method', 50).notNullable().defaultTo('MANUAL');

    // Location
    table.jsonb('address').notNullable();
    table.jsonb('location_verification');

    // Tasks and requirements
    table.jsonb('task_ids');
    table.jsonb('required_skills');
    table.jsonb('required_certifications');

    // Status
    table.string('status', 50).notNullable().defaultTo('UNASSIGNED');
    table.jsonb('status_history').notNullable().defaultTo('[]');

    // Flags
    table.boolean('is_urgent').defaultTo(false);
    table.boolean('is_priority').defaultTo(false);
    table.boolean('requires_supervision').defaultTo(false);
    table.jsonb('risk_flags');

    // Verification (EVV compliance)
    table.string('verification_method', 50);
    table.jsonb('verification_data');

    // Completion
    table.text('completion_notes');
    table.integer('tasks_completed');
    table.integer('tasks_total');
    table.boolean('incident_reported');

    // Signature
    table.boolean('signature_required').defaultTo(true);
    table.boolean('signature_captured');
    table.jsonb('signature_data');

    // Billing
    table.decimal('billable_hours', 5, 2);
    table.string('billing_status', 50);
    table.text('billing_notes');

    // Instructions and notes
    table.text('client_instructions');
    table.text('caregiver_instructions');
    table.text('internal_notes');
    table.specificType('tags', 'TEXT[]');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Constraints
    table.check(
      `visit_type IN ('REGULAR', 'INITIAL', 'DISCHARGE', 'RESPITE', 'EMERGENCY', 'MAKEUP', 'SUPERVISION', 'ASSESSMENT')`
    );
    table.check(`scheduled_duration BETWEEN 15 AND 1440`);
    table.check(
      `assignment_method IN ('MANUAL', 'AUTO_MATCH', 'SELF_ASSIGN', 'PREFERRED', 'OVERFLOW')`
    );
    table.check(
      `status IN ('DRAFT', 'SCHEDULED', 'UNASSIGNED', 'ASSIGNED', 'CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'INCOMPLETE', 'CANCELLED', 'NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER', 'REJECTED')`
    );
    table.check(`verification_method IN ('GPS', 'PHONE', 'FACIAL', 'BIOMETRIC', 'MANUAL')`);
    table.check(`tasks_completed >= 0`);
    table.check(`tasks_total >= 0`);
    table.check(`tasks_total IS NULL OR tasks_completed IS NULL OR tasks_completed <= tasks_total`);
    table.check(`billable_hours >= 0`);
    table.check(`billing_status IN ('PENDING', 'READY', 'BILLED', 'PAID', 'DENIED', 'ADJUSTED')`);
    table.check(`scheduled_start_time < scheduled_end_time`);
    table.check(
      `actual_end_time IS NULL OR actual_start_time IS NULL OR actual_start_time < actual_end_time`
    );

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('pattern_id').references('id').inTable('service_patterns');
    table.foreign('schedule_id').references('id').inTable('schedules');
    table.foreign('assigned_caregiver_id').references('id').inTable('caregivers');
    table.foreign('assigned_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');
  });

  // Indexes for visits
  await knex.raw(
    'CREATE INDEX idx_visits_organization ON visits(organization_id) WHERE deleted_at IS NULL'
  );
  await knex.raw('CREATE INDEX idx_visits_branch ON visits(branch_id) WHERE deleted_at IS NULL');
  await knex.raw(
    'CREATE INDEX idx_visits_client ON visits(client_id, scheduled_date) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_visits_caregiver ON visits(assigned_caregiver_id, scheduled_date) WHERE deleted_at IS NULL'
  );
  await knex.raw('CREATE INDEX idx_visits_pattern ON visits(pattern_id) WHERE deleted_at IS NULL');
  await knex.raw(
    'CREATE INDEX idx_visits_schedule ON visits(schedule_id) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_visits_date ON visits(scheduled_date, scheduled_start_time) WHERE deleted_at IS NULL'
  );
  await knex.raw('CREATE INDEX idx_visits_status ON visits(status) WHERE deleted_at IS NULL');
  await knex.raw(
    'CREATE INDEX idx_visits_billing ON visits(billing_status) WHERE deleted_at IS NULL AND billing_status IS NOT NULL'
  );

  // Composite indexes for common queries
  await knex.raw(`
    CREATE INDEX idx_visits_unassigned ON visits(organization_id, branch_id, scheduled_date) 
      WHERE deleted_at IS NULL AND assigned_caregiver_id IS NULL AND status IN ('UNASSIGNED', 'SCHEDULED')
  `);
  await knex.raw(`
    CREATE INDEX idx_visits_urgent ON visits(organization_id, scheduled_date, is_urgent) 
      WHERE deleted_at IS NULL AND is_urgent = true
  `);

  // Full-text search index
  await knex.raw(`
    CREATE INDEX idx_visits_search ON visits 
      USING gin(to_tsvector('english', 
        coalesce(visit_number, '') || ' ' ||
        coalesce(client_instructions, '') || ' ' || 
        coalesce(caregiver_instructions, '') || ' ' ||
        coalesce(internal_notes, '')))
      WHERE deleted_at IS NULL
  `);

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_visits_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_visits_updated_at
      BEFORE UPDATE ON visits
      FOR EACH ROW
      EXECUTE FUNCTION update_visits_updated_at()
  `);

  // Visit exceptions table
  await knex.schema.createTable('visit_exceptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('visit_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('caregiver_id');

    table.string('exception_type', 50).notNullable();
    table.string('severity', 50).notNullable();

    table.timestamp('detected_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('detected_by');
    table.boolean('automatic').notNullable().defaultTo(false);

    table.text('description').notNullable();
    table.text('resolution');
    table.timestamp('resolved_at');
    table.uuid('resolved_by');

    table.boolean('requires_followup').defaultTo(false);
    table.uuid('followup_assigned_to');

    table.string('status', 50).notNullable().defaultTo('OPEN');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check(
      `exception_type IN ('LATE_START', 'EARLY_END', 'OVERTIME', 'NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER', 'LOCATION_MISMATCH', 'MISSED_TASKS', 'SAFETY_CONCERN', 'EQUIPMENT_ISSUE', 'MEDICATION_ISSUE', 'CLIENT_REFUSED', 'EMERGENCY', 'OTHER')`
    );
    table.check(`severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
    table.check(`status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED')`);

    // Foreign keys
    table.foreign('visit_id').references('id').inTable('visits');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('caregiver_id').references('id').inTable('caregivers');
    table.foreign('detected_by').references('id').inTable('users');
    table.foreign('resolved_by').references('id').inTable('users');
    table.foreign('followup_assigned_to').references('id').inTable('users');
  });

  await knex.raw('CREATE INDEX idx_exceptions_visit ON visit_exceptions(visit_id)');
  await knex.raw('CREATE INDEX idx_exceptions_status ON visit_exceptions(status)');
  await knex.raw('CREATE INDEX idx_exceptions_type ON visit_exceptions(exception_type)');
  await knex.raw(
    "CREATE INDEX idx_exceptions_severity ON visit_exceptions(severity) WHERE status != 'RESOLVED'"
  );
  await knex.raw(
    "CREATE INDEX idx_exceptions_followup ON visit_exceptions(followup_assigned_to) WHERE requires_followup = true AND status != 'RESOLVED'"
  );

  // Comments for documentation
  await knex.raw(
    "COMMENT ON TABLE service_patterns IS 'Templates for recurring service schedules'"
  );
  await knex.raw("COMMENT ON TABLE schedules IS 'Generated visit schedules from patterns'");
  await knex.raw("COMMENT ON TABLE visits IS 'Individual care visit occurrences'");
  await knex.raw("COMMENT ON TABLE visit_exceptions IS 'Exceptions and issues during visits'");

  await knex.raw(
    "COMMENT ON COLUMN service_patterns.recurrence IS 'JSONB: Recurrence rule with frequency, interval, days/dates, start/end times, timezone'"
  );
  await knex.raw(
    "COMMENT ON COLUMN service_patterns.flexibility_window IS 'Allowed variance in minutes from scheduled time'"
  );
  await knex.raw(
    "COMMENT ON COLUMN visits.status_history IS 'JSONB: Array of status change records with timestamps and reasons'"
  );
  await knex.raw(
    "COMMENT ON COLUMN visits.location_verification IS 'JSONB: GPS coordinates and verification data for EVV compliance'"
  );
  await knex.raw(
    "COMMENT ON COLUMN visits.verification_data IS 'JSONB: Clock in/out verification records'"
  );
  await knex.raw(
    "COMMENT ON COLUMN visits.signature_data IS 'JSONB: Digital signature capture data'"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS trigger_visits_updated_at ON visits');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_patterns_updated_at ON service_patterns');
  await knex.raw('DROP FUNCTION IF EXISTS update_visits_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_patterns_updated_at()');
  await knex.schema.dropTableIfExists('visit_exceptions');
  await knex.schema.dropTableIfExists('visits');
  await knex.schema.dropTableIfExists('schedules');
  await knex.schema.dropTableIfExists('service_patterns');
}
