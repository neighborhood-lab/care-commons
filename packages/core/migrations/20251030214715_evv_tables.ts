import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // EVV records table
  await knex.schema.createTable('evv_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('visit_id').notNullable().unique();
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('caregiver_id').notNullable();

    // Required EVV elements (21st Century Cures Act)
    table.string('service_type_code', 50).notNullable();
    table.string('service_type_name', 200).notNullable();
    table.string('client_name', 200).notNullable(); // Encrypted at rest
    table.string('client_medicaid_id', 50); // Encrypted at rest
    table.string('caregiver_name', 200).notNullable();
    table.string('caregiver_employee_id', 50).notNullable();
    table.string('caregiver_npi', 20); // National Provider Identifier
    table.date('service_date').notNullable();
    table.jsonb('service_address').notNullable();

    // Time service begins and ends
    table.timestamp('clock_in_time').notNullable();
    table.timestamp('clock_out_time');
    table.integer('total_duration'); // minutes

    // Location verification
    table.jsonb('clock_in_verification').notNullable();
    table.jsonb('clock_out_verification');
    table.jsonb('mid_visit_checks'); // Array of location checks during visit

    // Events
    table.jsonb('pause_events'); // Array of pause/resume events
    table.jsonb('exception_events'); // Array of exception events

    // Compliance and integrity
    table.string('record_status', 50).notNullable().defaultTo('PENDING');
    table.string('verification_level', 50).notNullable();
    table.jsonb('compliance_flags').notNullable().defaultTo('["COMPLIANT"]');
    table.string('integrity_hash', 64).notNullable(); // SHA-256 hash of core data
    table.string('integrity_checksum', 64).notNullable(); // Additional tamper detection

    // Audit and sync
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('recorded_by').notNullable();
    table.jsonb('sync_metadata').notNullable();
    table.timestamp('submitted_to_payor');
    table.string('payor_approval_status', 50);

    // State-specific extensibility
    table.jsonb('state_specific_data');

    // Attestations
    table.jsonb('caregiver_attestation');
    table.jsonb('client_attestation');
    table.jsonb('supervisor_review');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(
      `record_status IN ('PENDING', 'COMPLETE', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISPUTED', 'AMENDED', 'VOIDED')`
    );
    table.check(`verification_level IN ('FULL', 'PARTIAL', 'MANUAL', 'PHONE', 'EXCEPTION')`);
    table.check(`clock_out_time IS NULL OR clock_in_time < clock_out_time`);
    table.check(`total_duration IS NULL OR total_duration >= 0`);
    table.check(
      `payor_approval_status IN ('PENDING', 'APPROVED', 'DENIED', 'PENDING_INFO', 'APPEALED')`
    );

    // Foreign keys
    table.foreign('visit_id').references('id').inTable('visits');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('caregiver_id').references('id').inTable('caregivers');
    table.foreign('recorded_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for evv_records
  await knex.raw('CREATE INDEX idx_evv_visit ON evv_records(visit_id)');
  await knex.raw('CREATE INDEX idx_evv_organization ON evv_records(organization_id, service_date)');
  await knex.raw('CREATE INDEX idx_evv_branch ON evv_records(branch_id, service_date)');
  await knex.raw('CREATE INDEX idx_evv_client ON evv_records(client_id, service_date)');
  await knex.raw('CREATE INDEX idx_evv_caregiver ON evv_records(caregiver_id, service_date)');
  await knex.raw('CREATE INDEX idx_evv_service_date ON evv_records(service_date)');
  await knex.raw('CREATE INDEX idx_evv_status ON evv_records(record_status)');
  await knex.raw('CREATE INDEX idx_evv_verification_level ON evv_records(verification_level)');
  await knex.raw('CREATE INDEX idx_evv_compliance ON evv_records USING gin(compliance_flags)');
  await knex.raw(
    'CREATE INDEX idx_evv_submission ON evv_records(submitted_to_payor) WHERE submitted_to_payor IS NOT NULL'
  );
  await knex.raw(
    "CREATE INDEX idx_evv_pending ON evv_records(organization_id, service_date) WHERE record_status = 'PENDING'"
  );
  await knex.raw(`
    CREATE INDEX idx_evv_flagged ON evv_records(organization_id, service_date) 
      WHERE compliance_flags @> '["GEOFENCE_VIOLATION"]'::jsonb 
         OR compliance_flags @> '["LOCATION_SUSPICIOUS"]'::jsonb
  `);

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_evv_records_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_evv_records_updated_at
      BEFORE UPDATE ON evv_records
      FOR EACH ROW
      EXECUTE FUNCTION update_evv_records_updated_at()
  `);

  // Time entries table
  await knex.schema.createTable('time_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('visit_id').notNullable();
    table.uuid('evv_record_id');
    table.uuid('organization_id').notNullable();
    table.uuid('caregiver_id').notNullable();
    table.uuid('client_id').notNullable();

    // Entry details
    table.string('entry_type', 50).notNullable();
    table.timestamp('entry_timestamp').notNullable();

    // Location
    table.jsonb('location').notNullable();

    // Device
    table.string('device_id', 100).notNullable();
    table.jsonb('device_info').notNullable();

    // Integrity
    table.string('integrity_hash', 64).notNullable();
    table.timestamp('server_received_at').notNullable().defaultTo(knex.fn.now());

    // Sync (for offline capability)
    table.jsonb('sync_metadata').notNullable();
    table.boolean('offline_recorded').defaultTo(false);
    table.timestamp('offline_recorded_at');

    // Verification
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.boolean('verification_passed').notNullable();
    table.jsonb('verification_issues');
    table.jsonb('manual_override');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`entry_type IN ('CLOCK_IN', 'CLOCK_OUT', 'PAUSE', 'RESUME', 'CHECK_IN')`);
    table.check(`status IN ('PENDING', 'VERIFIED', 'FLAGGED', 'OVERRIDDEN', 'REJECTED', 'SYNCED')`);

    // Foreign keys
    table.foreign('visit_id').references('id').inTable('visits');
    table.foreign('evv_record_id').references('id').inTable('evv_records');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('caregiver_id').references('id').inTable('caregivers');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for time_entries
  await knex.raw('CREATE INDEX idx_time_entries_visit ON time_entries(visit_id, entry_timestamp)');
  await knex.raw('CREATE INDEX idx_time_entries_evv ON time_entries(evv_record_id)');
  await knex.raw(
    'CREATE INDEX idx_time_entries_organization ON time_entries(organization_id, entry_timestamp)'
  );
  await knex.raw(
    'CREATE INDEX idx_time_entries_caregiver ON time_entries(caregiver_id, entry_timestamp)'
  );
  await knex.raw(
    'CREATE INDEX idx_time_entries_client ON time_entries(client_id, entry_timestamp)'
  );
  await knex.raw('CREATE INDEX idx_time_entries_status ON time_entries(status)');
  await knex.raw('CREATE INDEX idx_time_entries_type ON time_entries(entry_type, entry_timestamp)');
  await knex.raw(
    'CREATE INDEX idx_time_entries_device ON time_entries(device_id, entry_timestamp)'
  );
  await knex.raw(
    'CREATE INDEX idx_time_entries_offline ON time_entries(offline_recorded, status) WHERE offline_recorded = true'
  );
  await knex.raw(
    "CREATE INDEX idx_time_entries_pending ON time_entries(organization_id, status) WHERE status = 'PENDING'"
  );
  await knex.raw(
    "CREATE INDEX idx_time_entries_flagged ON time_entries(organization_id, entry_timestamp) WHERE status = 'FLAGGED'"
  );

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_time_entries_updated_at
      BEFORE UPDATE ON time_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_time_entries_updated_at()
  `);

  // Geofences table
  await knex.schema.createTable('geofences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('address_id').notNullable(); // Links to address in client or visit

    // Location
    table.decimal('center_latitude', 10, 8).notNullable();
    table.decimal('center_longitude', 11, 8).notNullable();
    table.integer('radius_meters').notNullable();
    table.string('radius_type', 50).notNullable().defaultTo('STANDARD');
    table.string('shape', 50).notNullable().defaultTo('CIRCLE');
    table.jsonb('polygon_points'); // Array of lat/lng points for polygon geofences

    // Settings
    table.boolean('is_active').defaultTo(true);
    table.integer('allowed_variance').defaultTo(0); // Additional meters

    // Calibration
    table.timestamp('calibrated_at');
    table.uuid('calibrated_by');
    table.string('calibration_method', 50);
    table.text('calibration_notes');

    // Performance metrics
    table.integer('verification_count').defaultTo(0);
    table.integer('successful_verifications').defaultTo(0);
    table.integer('failed_verifications').defaultTo(0);
    table.decimal('average_accuracy', 8, 2); // Average GPS accuracy in meters

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`radius_meters BETWEEN 10 AND 500`);
    table.check(`radius_type IN ('STANDARD', 'EXPANDED', 'CUSTOM')`);
    table.check(`shape IN ('CIRCLE', 'POLYGON')`);
    table.check(`allowed_variance BETWEEN 0 AND 100`);
    table.check(`calibration_method IN ('AUTO', 'MANUAL')`);
    table.check(`verification_count >= 0`);
    table.check(`successful_verifications >= 0`);
    table.check(`failed_verifications >= 0`);
    table.check(`status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')`);
    table.check(`successful_verifications + failed_verifications <= verification_count`);
    table.check(`shape != 'POLYGON' OR polygon_points IS NOT NULL`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('calibrated_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for geofences
  await knex.raw('CREATE INDEX idx_geofences_organization ON geofences(organization_id)');
  await knex.raw('CREATE INDEX idx_geofences_client ON geofences(client_id)');
  await knex.raw(
    "CREATE INDEX idx_geofences_address ON geofences(address_id) WHERE is_active = true AND status = 'ACTIVE'"
  );
  await knex.raw(
    "CREATE INDEX idx_geofences_location ON geofences(center_latitude, center_longitude) WHERE is_active = true AND status = 'ACTIVE'"
  );
  await knex.raw(
    "CREATE INDEX idx_geofences_active ON geofences(organization_id, status) WHERE is_active = true AND status = 'ACTIVE'"
  );
  await knex.raw(
    'CREATE INDEX idx_geofences_performance ON geofences(verification_count DESC, average_accuracy) WHERE is_active = true'
  );

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_geofences_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_geofences_updated_at
      BEFORE UPDATE ON geofences
      FOR EACH ROW
      EXECUTE FUNCTION update_geofences_updated_at()
  `);

  // Comments for documentation
  await knex.raw(
    "COMMENT ON TABLE evv_records IS 'Electronic Visit Verification records for compliance and billing'"
  );
  await knex.raw(
    "COMMENT ON TABLE time_entries IS 'Individual clock-in/out events with location verification'"
  );
  await knex.raw("COMMENT ON TABLE geofences IS 'Virtual boundaries for location verification'");

  await knex.raw(
    "COMMENT ON COLUMN evv_records.service_type_code IS 'Federal requirement: Type of service performed'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.client_name IS 'Federal requirement: Individual receiving service (encrypted)'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.caregiver_name IS 'Federal requirement: Individual providing service'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.service_date IS 'Federal requirement: Date of service'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.service_address IS 'Federal requirement: Location of service delivery'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.clock_in_time IS 'Federal requirement: Time service begins'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.clock_out_time IS 'Federal requirement: Time service ends'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.clock_in_verification IS 'JSONB: GPS coordinates, accuracy, device info for clock-in'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.clock_out_verification IS 'JSONB: GPS coordinates, accuracy, device info for clock-out'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.compliance_flags IS 'JSONB: Array of compliance flags (COMPLIANT, GEOFENCE_VIOLATION, etc.)'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.integrity_hash IS 'SHA-256 hash of core EVV data for tamper detection'"
  );
  await knex.raw(
    "COMMENT ON COLUMN evv_records.sync_metadata IS 'JSONB: Sync status, IDs, timestamps for offline capability'"
  );

  await knex.raw(
    "COMMENT ON COLUMN time_entries.location IS 'JSONB: Complete location verification data'"
  );
  await knex.raw(
    "COMMENT ON COLUMN time_entries.device_info IS 'JSONB: Device model, OS, app version, security status'"
  );
  await knex.raw(
    "COMMENT ON COLUMN time_entries.integrity_hash IS 'SHA-256 hash for tamper detection'"
  );
  await knex.raw(
    "COMMENT ON COLUMN time_entries.sync_metadata IS 'JSONB: Offline sync status and conflict resolution'"
  );
  await knex.raw(
    "COMMENT ON COLUMN time_entries.manual_override IS 'JSONB: Supervisor override details if verification failed'"
  );

  await knex.raw(
    "COMMENT ON COLUMN geofences.radius_meters IS 'Geofence radius in meters (10-500m allowed)'"
  );
  await knex.raw(
    "COMMENT ON COLUMN geofences.allowed_variance IS 'Additional tolerance in meters for GPS accuracy'"
  );
  await knex.raw(
    "COMMENT ON COLUMN geofences.verification_count IS 'Total verification attempts at this location'"
  );
  await knex.raw(
    "COMMENT ON COLUMN geofences.successful_verifications IS 'Count of successful verifications'"
  );
  await knex.raw(
    "COMMENT ON COLUMN geofences.failed_verifications IS 'Count of failed verifications'"
  );
  await knex.raw(
    "COMMENT ON COLUMN geofences.average_accuracy IS 'Running average of GPS accuracy at this location'"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS trigger_geofences_updated_at ON geofences');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_time_entries_updated_at ON time_entries');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_evv_records_updated_at ON evv_records');
  await knex.raw('DROP FUNCTION IF EXISTS update_geofences_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_time_entries_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_evv_records_updated_at()');
  await knex.schema.dropTableIfExists('geofences');
  await knex.schema.dropTableIfExists('time_entries');
  await knex.schema.dropTableIfExists('evv_records');
}
