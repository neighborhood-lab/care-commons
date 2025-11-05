/**
 * Multi-State EVV Expansion Migration
 * 
 * Adds support for 5 new states: OH, PA, GA, NC, AZ
 * 
 * BUSINESS IMPACT:
 * - Expands from 2 states (TX, FL) to 7 states total
 * - Opens addressable market from ~8,000 agencies to ~36,000 agencies
 * - 3x+ market expansion with minimal code duplication
 * 
 * TECHNICAL APPROACH:
 * - Modifies existing state_code constraints to include new states
 * - No new tables needed - existing schema supports multi-state pattern
 * - Leverages code reuse: Sandata serves 4 states with single implementation
 * 
 * STATE AGGREGATOR MAPPING:
 * - Ohio (OH) → Sandata
 * - Pennsylvania (PA) → Sandata
 * - North Carolina (NC) → Sandata
 * - Arizona (AZ) → Sandata
 * - Georgia (GA) → Tellus (Netsmart)
 * - Texas (TX) → HHAeXchange (existing)
 * - Florida (FL) → Multi-aggregator (existing)
 */

import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('Starting multi-state EVV expansion migration...');
  
  // ============================================================================
  // UPDATE STATE CODE CONSTRAINTS
  // ============================================================================
  
  // Drop old constraint on evv_state_config that only allowed TX and FL
  await knex.raw(`
    ALTER TABLE evv_state_config
    DROP CONSTRAINT IF EXISTS chk_state_code
  `);
  
  // Add new constraint with all 7 supported states
  await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_state_code CHECK (state_code IN (
      'TX',  -- Texas (HHAeXchange)
      'FL',  -- Florida (Multi-aggregator)
      'OH',  -- Ohio (Sandata)
      'PA',  -- Pennsylvania (Sandata)
      'GA',  -- Georgia (Tellus)
      'NC',  -- North Carolina (Sandata)
      'AZ'   -- Arizona (Sandata)
    ))
  `);
  
  // Drop old constraint on state_aggregator_submissions
  await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    DROP CONSTRAINT IF EXISTS chk_state_code
  `);
  
  // Add new constraint with all 7 supported states
  await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_state_code CHECK (state_code IN (
      'TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'
    ))
  `);
  
  // ============================================================================
  // ADD STATE-SPECIFIC COLUMNS (if needed)
  // ============================================================================
  
  // Pennsylvania requires 7-year retention (longest of all states)
  // Add column to track state-specific retention requirements
  await knex.schema.alterTable('evv_state_config', (table) => {
    table.integer('retention_years').defaultTo(6); // Federal minimum is 6 years
    table.integer('immutable_after_days').defaultTo(30); // Days after which VMUR-like process required
  });
  
  // Add comment explaining the retention requirements
  await knex.raw(`
    COMMENT ON COLUMN evv_state_config.retention_years IS 
    'Minimum years to retain EVV records per state regulation. Federal minimum: 6 years. PA requires: 7 years.'
  `);
  
  await knex.raw(`
    COMMENT ON COLUMN evv_state_config.immutable_after_days IS 
    'Days after which EVV records become immutable and require correction workflow (like TX VMUR). Varies by state: TX=30, FL=45, most others=30.'
  `);
  
  // ============================================================================
  // ADD AGGREGATOR-SPECIFIC FIELDS
  // ============================================================================
  
  // Sandata-specific: OAuth 2.0 token endpoint
  // Tellus-specific: Additional metadata requirements
  await knex.schema.alterTable('evv_state_config', (table) => {
    table.text('aggregator_auth_endpoint').nullable(); // OAuth token endpoint for Sandata
    table.string('aggregator_client_id', 200).nullable(); // OAuth client ID
    table.text('aggregator_client_secret_encrypted').nullable(); // OAuth client secret (encrypted)
    table.jsonb('aggregator_metadata').nullable(); // Additional aggregator-specific config
  });
  
  // ============================================================================
  // ADD INDEXES FOR NEW STATES
  // ============================================================================
  
  // Add index for Sandata states (OH, PA, NC, AZ) for batch queries
  await knex.raw(`
    CREATE INDEX idx_evv_state_config_sandata_states ON evv_state_config(organization_id, state_code)
    WHERE state_code IN ('OH', 'PA', 'NC', 'AZ')
  `);
  
  // Add index for aggregator submissions by new states
  await knex.raw(`
    CREATE INDEX idx_aggregator_submissions_new_states ON state_aggregator_submissions(state_code, submitted_at)
    WHERE state_code IN ('OH', 'PA', 'GA', 'NC', 'AZ')
  `);
  
  // ============================================================================
  // STATE-SPECIFIC VALIDATION RULES TABLE (Optional Enhancement)
  // ============================================================================
  
  // This table stores state-specific geofence, grace period, and validation rules
  // Enables runtime configuration without code changes
  await knex.schema.createTable('evv_state_validation_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('state_code', 2).notNullable().unique();
    
    // Geofence parameters
    table.integer('geofence_radius_meters').notNullable().defaultTo(100);
    table.integer('geofence_tolerance_meters').notNullable().defaultTo(50);
    table.text('geofence_tolerance_reason');
    
    // Grace periods (minutes)
    table.integer('max_clock_in_early_minutes').notNullable().defaultTo(10);
    table.integer('max_clock_out_late_minutes').notNullable().defaultTo(10);
    table.integer('overtime_threshold_minutes').notNullable().defaultTo(15);
    
    // GPS requirements
    table.integer('minimum_gps_accuracy_meters').notNullable().defaultTo(100);
    
    // Additional requirements
    table.boolean('requires_biometric').defaultTo(false);
    table.boolean('requires_photo').defaultTo(false);
    table.boolean('requires_client_attestation').defaultTo(false);
    
    // Override policies
    table.boolean('allow_manual_override').defaultTo(true);
    table.boolean('manual_override_requires_supervisor').defaultTo(true);
    table.jsonb('manual_override_reason_codes');
    
    // Compliance
    table.integer('retention_years').notNullable().defaultTo(6);
    table.integer('immutable_after_days').notNullable().defaultTo(30);
    
    // Metadata
    table.string('state_department', 50); // ODM, DHS, DCH, DHHS, AHCCCS
    table.jsonb('state_programs'); // Array of Medicaid program types
    table.boolean('lenient_rural_policy').defaultTo(false); // GA has most lenient
    table.boolean('hcbs_waiver_focus').defaultTo(false); // GA waiver programs
    table.boolean('non_medical_exempt').defaultTo(false); // AZ non-medical NPI exemption
    
    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
  });
  
  // Add constraints to evv_state_validation_rules
  await knex.raw(`
    ALTER TABLE evv_state_validation_rules
    ADD CONSTRAINT chk_validation_state_code CHECK (state_code IN (
      'TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'
    ))
  `);
  
  await knex.raw(`
    ALTER TABLE evv_state_validation_rules
    ADD CONSTRAINT chk_geofence_radius CHECK (geofence_radius_meters BETWEEN 50 AND 300)
  `);
  
  await knex.raw(`
    ALTER TABLE evv_state_validation_rules
    ADD CONSTRAINT chk_geofence_tolerance CHECK (geofence_tolerance_meters BETWEEN 0 AND 200)
  `);
  
  await knex.raw(`
    ALTER TABLE evv_state_validation_rules
    ADD CONSTRAINT chk_retention_years CHECK (retention_years BETWEEN 6 AND 10)
  `);
  
  // ============================================================================
  // SEED STATE VALIDATION RULES
  // ============================================================================
  
  // Insert validation rules for all 7 states
  // These match the StateEVVRules defined in state-specific.ts
  
  // System user ID for seeding (in production, use actual admin user)
  const systemUserId = '00000000-0000-0000-0000-000000000000';
  
  const stateRules = [
    {
      state_code: 'TX',
      geofence_radius_meters: 100,
      geofence_tolerance_meters: 50,
      geofence_tolerance_reason: 'HHSC EVV Policy allows tolerance for GPS accuracy',
      max_clock_in_early_minutes: 10,
      max_clock_out_late_minutes: 10,
      overtime_threshold_minutes: 15,
      minimum_gps_accuracy_meters: 100,
      retention_years: 6,
      immutable_after_days: 30,
      state_department: 'HHSC',
      state_programs: JSON.stringify(['STAR_PLUS', 'STAR_KIDS', 'COMMUNITY_FIRST_CHOICE', 'PRIMARY_HOME_CARE']),
      manual_override_reason_codes: JSON.stringify(['DEVICE_MALFUNCTION', 'GPS_UNAVAILABLE', 'SERVICE_LOCATION_CHANGE', 'EMERGENCY', 'RURAL_POOR_SIGNAL', 'OTHER_APPROVED']),
    },
    {
      state_code: 'FL',
      geofence_radius_meters: 150,
      geofence_tolerance_meters: 100,
      geofence_tolerance_reason: 'AHCA allows larger tolerance for diverse geography',
      max_clock_in_early_minutes: 15,
      max_clock_out_late_minutes: 15,
      overtime_threshold_minutes: 20,
      minimum_gps_accuracy_meters: 150,
      retention_years: 6,
      immutable_after_days: 45,
      state_department: 'AHCA',
      state_programs: JSON.stringify(['SMMC_LTC', 'SMMC_MMA', 'FFS_MEDICAID', 'DOEA_HOMECARE']),
      manual_override_reason_codes: JSON.stringify(['GPS_UNAVAILABLE', 'DEVICE_MALFUNCTION', 'CLIENT_LOCATION_CHANGE', 'EMERGENCY', 'TECHNICAL_ISSUE', 'OTHER']),
    },
    {
      state_code: 'OH',
      geofence_radius_meters: 125,
      geofence_tolerance_meters: 75,
      geofence_tolerance_reason: 'ODM allows reasonable GPS accuracy variance',
      max_clock_in_early_minutes: 10,
      max_clock_out_late_minutes: 10,
      overtime_threshold_minutes: 15,
      minimum_gps_accuracy_meters: 125,
      retention_years: 6,
      immutable_after_days: 30,
      state_department: 'ODM',
      state_programs: JSON.stringify(['OHIO_MEDICAID', 'MY_CARE', 'PASSPORT', 'ASSISTED_LIVING_WAIVER']),
      manual_override_reason_codes: JSON.stringify(['GPS_UNAVAILABLE', 'DEVICE_MALFUNCTION', 'EMERGENCY', 'TECHNICAL_ISSUE', 'OTHER']),
    },
    {
      state_code: 'PA',
      geofence_radius_meters: 100,
      geofence_tolerance_meters: 50,
      geofence_tolerance_reason: 'DHS EVV standards allow GPS accuracy variance',
      max_clock_in_early_minutes: 15,
      max_clock_out_late_minutes: 15,
      overtime_threshold_minutes: 15,
      minimum_gps_accuracy_meters: 100,
      retention_years: 7, // PA requires longest retention
      immutable_after_days: 35,
      state_department: 'DHS',
      state_programs: JSON.stringify(['COMMUNITY_HEALTHCHOICES', 'OBRA_WAIVER', 'AGING_WAIVER', 'ATTENDANT_CARE']),
      manual_override_reason_codes: JSON.stringify(['GPS_UNAVAILABLE', 'DEVICE_MALFUNCTION', 'RURAL_AREA', 'EMERGENCY', 'OTHER']),
    },
    {
      state_code: 'GA',
      geofence_radius_meters: 150,
      geofence_tolerance_meters: 100,
      geofence_tolerance_reason: 'DCH allows larger variance for rural areas',
      max_clock_in_early_minutes: 15,
      max_clock_out_late_minutes: 15,
      overtime_threshold_minutes: 20,
      minimum_gps_accuracy_meters: 150,
      retention_years: 6,
      immutable_after_days: 45,
      lenient_rural_policy: true,
      hcbs_waiver_focus: true,
      state_department: 'DCH',
      state_programs: JSON.stringify(['GEORGIA_MEDICAID', 'CCSP_WAIVER', 'SOURCE_WAIVER', 'NOW_COMP_WAIVER']),
      manual_override_reason_codes: JSON.stringify(['GPS_UNAVAILABLE', 'DEVICE_MALFUNCTION', 'RURAL_AREA', 'CLIENT_LOCATION_CHANGE', 'EMERGENCY', 'OTHER']),
    },
    {
      state_code: 'NC',
      geofence_radius_meters: 120,
      geofence_tolerance_meters: 60,
      geofence_tolerance_reason: 'DHHS allows moderate GPS variance',
      max_clock_in_early_minutes: 10,
      max_clock_out_late_minutes: 10,
      overtime_threshold_minutes: 15,
      minimum_gps_accuracy_meters: 120,
      retention_years: 6,
      immutable_after_days: 30,
      state_department: 'DHHS',
      state_programs: JSON.stringify(['NC_MEDICAID', 'CAP_DA', 'CAP_C', 'INNOVATIONS_WAIVER']),
      manual_override_reason_codes: JSON.stringify(['GPS_UNAVAILABLE', 'DEVICE_MALFUNCTION', 'EMERGENCY', 'RURAL_AREA', 'OTHER']),
    },
    {
      state_code: 'AZ',
      geofence_radius_meters: 100,
      geofence_tolerance_meters: 50,
      geofence_tolerance_reason: 'AHCCCS EVV policy GPS tolerance',
      max_clock_in_early_minutes: 10,
      max_clock_out_late_minutes: 10,
      overtime_threshold_minutes: 15,
      minimum_gps_accuracy_meters: 100,
      retention_years: 6,
      immutable_after_days: 30,
      non_medical_exempt: true, // Non-medical services exempt from NPI requirement
      state_department: 'AHCCCS',
      state_programs: JSON.stringify(['AHCCCS_ALTCS', 'DDD_WAIVER', 'EPD', 'SMI']),
      manual_override_reason_codes: JSON.stringify(['GPS_UNAVAILABLE', 'DEVICE_MALFUNCTION', 'EMERGENCY', 'RURAL_AREA', 'OTHER']),
    },
  ];
  
  // Insert all state rules
  for (const rule of stateRules) {
    await knex('evv_state_validation_rules').insert({
      ...rule,
      created_by: systemUserId,
      updated_by: systemUserId,
    });
  }
  
  console.log('Multi-state EVV expansion completed successfully!');
  console.log('Supported states: TX, FL, OH, PA, GA, NC, AZ');
  console.log('Aggregators: HHAeXchange (TX), Multi (FL), Sandata (OH, PA, NC, AZ), Tellus (GA)');
}

export async function down(knex: Knex): Promise<void> {
  console.log('Rolling back multi-state EVV expansion...');
  
  // Drop new table
  await knex.schema.dropTableIfExists('evv_state_validation_rules');
  
  // Drop new indexes
  await knex.raw('DROP INDEX IF EXISTS idx_aggregator_submissions_new_states');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_state_config_sandata_states');
  
  // Drop new columns from evv_state_config
  await knex.schema.alterTable('evv_state_config', (table) => {
    table.dropColumn('retention_years');
    table.dropColumn('immutable_after_days');
    table.dropColumn('aggregator_auth_endpoint');
    table.dropColumn('aggregator_client_id');
    table.dropColumn('aggregator_client_secret_encrypted');
    table.dropColumn('aggregator_metadata');
  });
  
  // Restore original state code constraints (TX and FL only)
  await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    DROP CONSTRAINT IF EXISTS chk_state_code
  `);
  
  await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_state_code CHECK (state_code IN ('TX', 'FL'))
  `);
  
  await knex.raw(`
    ALTER TABLE evv_state_config
    DROP CONSTRAINT IF EXISTS chk_state_code
  `);
  
  await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_state_code CHECK (state_code IN ('TX', 'FL'))
  `);
  
  console.log('Rollback completed. Reverted to TX and FL only.');
}
