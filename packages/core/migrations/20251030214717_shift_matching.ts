import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // OPEN SHIFTS
  // ============================================================================

  await knex.schema.createTable('open_shifts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    
    // Visit reference
    table.uuid('visit_id').notNullable().unique();
    table.uuid('client_id').notNullable();
    
    // Shift details
    table.date('scheduled_date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.integer('duration').notNullable().checkBetween([15, 1440]);
    table.string('timezone', 100).notNullable().defaultTo('America/New_York');
    
    // Service requirements
    table.uuid('service_type_id').notNullable();
    table.string('service_type_name', 200).notNullable();
    table.jsonb('task_ids');
    table.jsonb('required_skills');
    table.jsonb('required_certifications');
    
    // Client preferences and restrictions
    table.jsonb('preferred_caregivers');
    table.jsonb('blocked_caregivers');
    table.string('gender_preference', 50).checkIn(['MALE', 'FEMALE', 'NO_PREFERENCE']);
    table.string('language_preference', 100);
    
    // Location
    table.jsonb('address').notNullable();
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    
    // Priority and urgency
    table.string('priority', 50).notNullable().defaultTo('NORMAL').checkIn(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);
    table.boolean('is_urgent').defaultTo(false);
    table.timestamp('fill_by_date');
    
    // Matching metadata
    table.string('matching_status', 50).notNullable().defaultTo('NEW').checkIn(['NEW', 'MATCHING', 'MATCHED', 'PROPOSED', 'ASSIGNED', 'NO_MATCH', 'EXPIRED']);
    table.timestamp('last_matched_at');
    table.integer('match_attempts').notNullable().defaultTo(0);
    
    // Assignment tracking
    table.jsonb('proposed_assignments').defaultTo('[]');
    table.jsonb('rejected_caregivers').defaultTo('[]');
    
    // Metadata
    table.text('client_instructions');
    table.text('internal_notes');
    table.specificType('tags', 'TEXT[]');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Constraints
    table.check('start_time < end_time');
    table.foreign('visit_id').references('id').inTable('visits').onDelete('CASCADE');
  });

  // Add complex constraint that can't be expressed with table.check()
  await knex.raw('ALTER TABLE open_shifts ADD CONSTRAINT chk_fill_by_future CHECK (fill_by_date IS NULL OR fill_by_date > NOW())');

  // Indexes for open_shifts
  await knex.raw('CREATE INDEX idx_open_shifts_organization ON open_shifts(organization_id)');
  await knex.raw('CREATE INDEX idx_open_shifts_branch ON open_shifts(branch_id)');
  await knex.raw('CREATE INDEX idx_open_shifts_client ON open_shifts(client_id)');
  await knex.raw('CREATE INDEX idx_open_shifts_date ON open_shifts(scheduled_date, start_time)');
  await knex.raw('CREATE INDEX idx_open_shifts_status ON open_shifts(matching_status)');
  await knex.raw('CREATE INDEX idx_open_shifts_priority ON open_shifts(priority, is_urgent) WHERE matching_status IN (\'NEW\', \'MATCHING\', \'NO_MATCH\')');
  await knex.raw('CREATE INDEX idx_open_shifts_urgent ON open_shifts(scheduled_date) WHERE is_urgent = true AND matching_status NOT IN (\'ASSIGNED\', \'EXPIRED\')');
  await knex.raw('CREATE INDEX idx_open_shifts_fill_by ON open_shifts(fill_by_date) WHERE fill_by_date IS NOT NULL AND matching_status NOT IN (\'ASSIGNED\', \'EXPIRED\')');
  await knex.raw('CREATE INDEX idx_open_shifts_location ON open_shifts USING gist(point(longitude, latitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL');

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_open_shifts_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_open_shifts_updated_at
        BEFORE UPDATE ON open_shifts
        FOR EACH ROW
        EXECUTE FUNCTION update_open_shifts_updated_at();
  `);

  // ============================================================================
  // MATCHING CONFIGURATIONS
  // ============================================================================

  await knex.schema.createTable('matching_configurations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');
    
    table.string('name', 200).notNullable();
    table.text('description');
    
    // Score weights (must sum to 100)
    table.jsonb('weights').notNullable().defaultTo(JSON.stringify({
      skillMatch: 20,
      availabilityMatch: 20,
      proximityMatch: 15,
      preferenceMatch: 10,
      experienceMatch: 10,
      reliabilityMatch: 10,
      complianceMatch: 10,
      capacityMatch: 5
    }));
    
    // Constraints
    table.integer('max_travel_distance');
    table.integer('max_travel_time');
    table.boolean('require_exact_skill_match').defaultTo(false);
    table.boolean('require_active_certifications').defaultTo(true);
    table.boolean('respect_gender_preference').defaultTo(true);
    table.boolean('respect_language_preference').defaultTo(true);
    
    // Matching behavior
    table.integer('auto_assign_threshold');
    table.integer('min_score_for_proposal').notNullable().defaultTo(50);
    table.integer('max_proposals_per_shift').notNullable().defaultTo(5);
    table.integer('proposal_expiration_minutes').notNullable().defaultTo(120);
    
    // Optimization preferences
    table.string('optimize_for', 50).notNullable().defaultTo('BEST_MATCH').checkIn(['BEST_MATCH', 'FASTEST_FILL', 'COST_EFFICIENT', 'BALANCED_WORKLOAD', 'CONTINUITY', 'CAREGIVER_SATISFACTION']);
    table.boolean('consider_cost_efficiency').defaultTo(false);
    table.boolean('balance_workload_across_caregivers').defaultTo(false);
    table.boolean('prioritize_continuity_of_care').defaultTo(true);
    
    // Advanced rules
    table.boolean('prefer_same_caregiver_for_recurring').defaultTo(true);
    table.boolean('penalize_frequent_rejections').defaultTo(true);
    table.boolean('boost_reliable_performers').defaultTo(true);
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_default').defaultTo(false);
    
    table.text('notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add complex constraints
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT chk_max_travel_distance CHECK (max_travel_distance IS NULL OR max_travel_distance > 0)');
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT chk_max_travel_time CHECK (max_travel_time IS NULL OR max_travel_time > 0)');
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT chk_auto_assign_threshold CHECK (auto_assign_threshold IS NULL OR (auto_assign_threshold >= 0 AND auto_assign_threshold <= 100))');
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT chk_min_score_for_proposal CHECK (min_score_for_proposal >= 0 AND min_score_for_proposal <= 100)');
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT chk_max_proposals_per_shift CHECK (max_proposals_per_shift >= 1 AND max_proposals_per_shift <= 20)');
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT chk_proposal_expiration_minutes CHECK (proposal_expiration_minutes >= 15 AND proposal_expiration_minutes <= 1440)');
  await knex.raw('ALTER TABLE matching_configurations ADD CONSTRAINT unique_default_per_scope UNIQUE NULLS NOT DISTINCT (organization_id, branch_id, is_default) DEFERRABLE INITIALLY DEFERRED');

  // Indexes for matching_configurations
  await knex.raw('CREATE INDEX idx_matching_configs_org ON matching_configurations(organization_id)');
  await knex.raw('CREATE INDEX idx_matching_configs_branch ON matching_configurations(branch_id)');
  await knex.raw('CREATE INDEX idx_matching_configs_active ON matching_configurations(organization_id, is_active) WHERE is_active = true');
  await knex.raw('CREATE INDEX idx_matching_configs_default ON matching_configurations(organization_id, branch_id, is_default) WHERE is_default = true');

  // ============================================================================
  // ASSIGNMENT PROPOSALS
  // ============================================================================

  await knex.schema.createTable('assignment_proposals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    
    // Assignment details
    table.uuid('open_shift_id').notNullable();
    table.uuid('visit_id').notNullable();
    table.uuid('caregiver_id').notNullable();
    
    // Match quality
    table.integer('match_score').notNullable();
    table.string('match_quality', 50).notNullable().checkIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'INELIGIBLE']);
    table.jsonb('match_reasons').notNullable().defaultTo('[]');
    
    // Proposal lifecycle
    table.string('proposal_status', 50).notNullable().defaultTo('PENDING').checkIn(['PENDING', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED', 'WITHDRAWN']);
    table.uuid('proposed_by').notNullable();
    table.timestamp('proposed_at').notNullable().defaultTo(knex.fn.now());
    table.string('proposal_method', 50).notNullable().checkIn(['AUTOMATIC', 'MANUAL', 'CAREGIVER_SELF_SELECT']);
    
    // Response tracking
    table.boolean('sent_to_caregiver').defaultTo(false);
    table.timestamp('sent_at');
    table.string('notification_method', 50).checkIn(['PUSH', 'SMS', 'EMAIL', 'PHONE_CALL', 'IN_APP']);
    
    table.boolean('viewed_by_caregiver').defaultTo(false);
    table.timestamp('viewed_at');
    
    table.timestamp('responded_at');
    table.string('response_method', 50).checkIn(['MOBILE', 'WEB', 'PHONE', 'IN_PERSON']);
    
    // Decision
    table.timestamp('accepted_at');
    table.uuid('accepted_by');
    
    table.timestamp('rejected_at');
    table.uuid('rejected_by');
    table.text('rejection_reason');
    table.string('rejection_category', 50).checkIn(['TOO_FAR', 'TIME_CONFLICT', 'PERSONAL_REASON', 'PREFER_DIFFERENT_CLIENT', 'RATE_TOO_LOW', 'ALREADY_BOOKED', 'NOT_INTERESTED', 'OTHER']);
    
    table.timestamp('expired_at');
    
    // Priority flags
    table.boolean('is_preferred').defaultTo(false);
    table.boolean('urgency_flag').defaultTo(false);
    
    // Metadata
    table.text('notes');
    table.text('internal_notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
    
    // Foreign keys
    table.foreign('open_shift_id').references('id').inTable('open_shifts').onDelete('CASCADE');
    table.foreign('visit_id').references('id').inTable('visits').onDelete('CASCADE');
  });

  // Add complex constraints
  await knex.raw('ALTER TABLE assignment_proposals ADD CONSTRAINT chk_match_score CHECK (match_score >= 0 AND match_score <= 100)');
  await knex.raw(`
    ALTER TABLE assignment_proposals ADD CONSTRAINT chk_response_consistency CHECK (
      (proposal_status = 'ACCEPTED' AND accepted_at IS NOT NULL) OR
      (proposal_status = 'REJECTED' AND rejected_at IS NOT NULL) OR
      (proposal_status NOT IN ('ACCEPTED', 'REJECTED'))
    )
  `);

  // Indexes for assignment_proposals
  await knex.raw('CREATE INDEX idx_proposals_organization ON assignment_proposals(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_proposals_branch ON assignment_proposals(branch_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_proposals_open_shift ON assignment_proposals(open_shift_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_proposals_caregiver ON assignment_proposals(caregiver_id, proposal_status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_proposals_status ON assignment_proposals(proposal_status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_proposals_pending ON assignment_proposals(caregiver_id, proposed_at) WHERE deleted_at IS NULL AND proposal_status IN (\'PENDING\', \'SENT\', \'VIEWED\')');
  await knex.raw('CREATE INDEX idx_proposals_expiring ON assignment_proposals(sent_at) WHERE deleted_at IS NULL AND proposal_status IN (\'SENT\', \'VIEWED\')');
  await knex.raw('CREATE INDEX idx_proposals_match_quality ON assignment_proposals(match_quality, match_score) WHERE deleted_at IS NULL');

  // Trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_proposals_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_proposals_updated_at
        BEFORE UPDATE ON assignment_proposals
        FOR EACH ROW
        EXECUTE FUNCTION update_proposals_updated_at();
  `);

  // ============================================================================
  // CAREGIVER PREFERENCE PROFILES
  // ============================================================================

  await knex.schema.createTable('caregiver_preference_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('caregiver_id').notNullable().unique();
    table.uuid('organization_id').notNullable();
    
    // Shift preferences
    table.jsonb('preferred_days_of_week'); // Array of day names
    table.jsonb('preferred_time_ranges'); // Array of {startTime, endTime}
    table.jsonb('preferred_shift_types'); // Array of shift type names
    
    // Client preferences
    table.jsonb('preferred_client_ids');
    table.jsonb('preferred_client_types');
    table.jsonb('preferred_service_types');
    
    // Location preferences
    table.integer('max_travel_distance');
    table.specificType('preferred_zip_codes', 'TEXT[]');
    table.specificType('avoid_zip_codes', 'TEXT[]');
    
    // Work-life balance
    table.integer('max_shifts_per_day');
    table.integer('max_shifts_per_week');
    table.integer('max_hours_per_week');
    table.integer('require_minimum_hours_between_shifts');
    
    // Willingness
    table.boolean('willing_to_accept_urgent_shifts').defaultTo(true);
    table.boolean('willing_to_work_weekends').defaultTo(true);
    table.boolean('willing_to_work_holidays').defaultTo(false);
    table.boolean('accept_auto_assignment').defaultTo(false);
    
    // Notification preferences
    table.jsonb('notification_methods').notNullable().defaultTo(JSON.stringify(['PUSH', 'SMS']));
    table.time('quiet_hours_start');
    table.time('quiet_hours_end');
    
    // Metadata
    table.timestamp('last_updated').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add complex constraints
  await knex.raw('ALTER TABLE caregiver_preference_profiles ADD CONSTRAINT chk_max_travel_distance CHECK (max_travel_distance IS NULL OR max_travel_distance > 0)');
  await knex.raw('ALTER TABLE caregiver_preference_profiles ADD CONSTRAINT chk_max_shifts_per_day CHECK (max_shifts_per_day IS NULL OR (max_shifts_per_day >= 1 AND max_shifts_per_day <= 10))');
  await knex.raw('ALTER TABLE caregiver_preference_profiles ADD CONSTRAINT chk_max_shifts_per_week CHECK (max_shifts_per_week IS NULL OR (max_shifts_per_week >= 1 AND max_shifts_per_week <= 50))');
  await knex.raw('ALTER TABLE caregiver_preference_profiles ADD CONSTRAINT chk_max_hours_per_week CHECK (max_hours_per_week IS NULL OR (max_hours_per_week >= 1 AND max_hours_per_week <= 168))');
  await knex.raw('ALTER TABLE caregiver_preference_profiles ADD CONSTRAINT chk_minimum_hours_between_shifts CHECK (require_minimum_hours_between_shifts IS NULL OR require_minimum_hours_between_shifts >= 0)');
  await knex.raw('ALTER TABLE caregiver_preference_profiles ADD CONSTRAINT chk_quiet_hours CHECK (quiet_hours_end IS NULL OR quiet_hours_start IS NULL OR quiet_hours_start != quiet_hours_end)');

  // Indexes for caregiver_preference_profiles
  await knex.raw('CREATE INDEX idx_preferences_caregiver ON caregiver_preference_profiles(caregiver_id)');
  await knex.raw('CREATE INDEX idx_preferences_organization ON caregiver_preference_profiles(organization_id)');
  await knex.raw('CREATE INDEX idx_preferences_auto_assign ON caregiver_preference_profiles(caregiver_id) WHERE accept_auto_assignment = true');

  // ============================================================================
  // BULK MATCH REQUESTS
  // ============================================================================

  await knex.schema.createTable('bulk_match_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');
    
    // Request scope
    table.date('date_from').notNullable();
    table.date('date_to').notNullable();
    table.jsonb('open_shift_ids');
    
    // Configuration
    table.uuid('configuration_id');
    table.string('optimization_goal', 50).checkIn(['BEST_MATCH', 'FASTEST_FILL', 'COST_EFFICIENT', 'BALANCED_WORKLOAD', 'CONTINUITY', 'CAREGIVER_SATISFACTION']);
    
    // Processing
    table.uuid('requested_by').notNullable();
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    table.string('status', 50).notNullable().defaultTo('PENDING').checkIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']);
    
    table.timestamp('started_at');
    table.timestamp('completed_at');
    
    // Results
    table.integer('total_shifts').notNullable().defaultTo(0);
    table.integer('matched_shifts').notNullable().defaultTo(0);
    table.integer('unmatched_shifts').notNullable().defaultTo(0);
    table.integer('proposals_generated').notNullable().defaultTo(0);
    
    table.text('error_message');
    table.text('notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Foreign key
    table.foreign('configuration_id').references('id').inTable('matching_configurations');
  });

  // Add complex constraint
  await knex.raw('ALTER TABLE bulk_match_requests ADD CONSTRAINT chk_bulk_dates CHECK (date_from <= date_to)');

  // Indexes for bulk_match_requests
  await knex.raw('CREATE INDEX idx_bulk_requests_organization ON bulk_match_requests(organization_id)');
  await knex.raw('CREATE INDEX idx_bulk_requests_status ON bulk_match_requests(status)');
  await knex.raw('CREATE INDEX idx_bulk_requests_dates ON bulk_match_requests(date_from, date_to)');
  await knex.raw('CREATE INDEX idx_bulk_requests_pending ON bulk_match_requests(requested_at) WHERE status = \'PENDING\'');

  // ============================================================================
  // MATCH HISTORY
  // ============================================================================

  await knex.schema.createTable('match_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('open_shift_id').notNullable();
    table.uuid('visit_id').notNullable();
    table.uuid('caregiver_id');
    
    // Match attempt
    table.integer('attempt_number').notNullable();
    table.timestamp('matched_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('matched_by');
    
    table.integer('match_score');
    table.string('match_quality', 50).checkIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'INELIGIBLE']);
    
    // Outcome
    table.string('outcome', 50).notNullable().checkIn(['PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED', 'NO_CANDIDATES', 'MANUAL_OVERRIDE']);
    table.timestamp('outcome_determined_at');
    
    // If assigned
    table.uuid('assignment_proposal_id');
    table.boolean('assigned_successfully').defaultTo(false);
    
    // If rejected
    table.text('rejection_reason');
    
    // Configuration used
    table.uuid('configuration_id');
    table.jsonb('configuration_snapshot');
    
    // Performance tracking
    table.integer('response_time_minutes');
    
    table.text('notes');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Foreign keys
    table.foreign('open_shift_id').references('id').inTable('open_shifts').onDelete('CASCADE');
    table.foreign('assignment_proposal_id').references('id').inTable('assignment_proposals').onDelete('SET NULL');
  });

  // Add complex constraints
  await knex.raw('ALTER TABLE match_history ADD CONSTRAINT chk_attempt_number CHECK (attempt_number > 0)');
  await knex.raw('ALTER TABLE match_history ADD CONSTRAINT chk_match_score CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100))');
  await knex.raw('ALTER TABLE match_history ADD CONSTRAINT chk_response_time_minutes CHECK (response_time_minutes IS NULL OR response_time_minutes >= 0)');

  // Indexes for match_history
  await knex.raw('CREATE INDEX idx_history_open_shift ON match_history(open_shift_id)');
  await knex.raw('CREATE INDEX idx_history_caregiver ON match_history(caregiver_id) WHERE caregiver_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_history_outcome ON match_history(outcome)');
  await knex.raw('CREATE INDEX idx_history_matched_at ON match_history(matched_at)');
  await knex.raw('CREATE INDEX idx_history_performance ON match_history(caregiver_id, outcome, response_time_minutes) WHERE caregiver_id IS NOT NULL AND outcome IN (\'ACCEPTED\', \'REJECTED\')');

  // ============================================================================
  // MATERIALIZED VIEW FOR ACTIVE OPEN SHIFTS
  // ============================================================================

  await knex.raw(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS active_open_shifts AS
    SELECT 
        os.id,
        os.organization_id,
        os.branch_id,
        os.visit_id,
        os.client_id,
        os.scheduled_date,
        os.start_time,
        os.end_time,
        os.duration,
        os.service_type_name,
        os.priority,
        os.is_urgent,
        os.matching_status,
        os.match_attempts,
        os.latitude,
        os.longitude,
        os.fill_by_date,
        os.required_skills,
        os.required_certifications,
        COUNT(ap.id) FILTER (WHERE ap.proposal_status IN ('PENDING', 'SENT', 'VIEWED')) as active_proposals,
        MAX(ap.match_score) as best_match_score,
        os.created_at
    FROM open_shifts os
    LEFT JOIN assignment_proposals ap ON os.id = ap.open_shift_id AND ap.deleted_at IS NULL
    WHERE os.matching_status NOT IN ('ASSIGNED', 'EXPIRED')
      AND os.scheduled_date >= CURRENT_DATE
    GROUP BY os.id;
  `);

  await knex.raw('CREATE INDEX idx_active_open_shifts_org ON active_open_shifts(organization_id)');
  await knex.raw('CREATE INDEX idx_active_open_shifts_branch ON active_open_shifts(branch_id)');
  await knex.raw('CREATE INDEX idx_active_open_shifts_date ON active_open_shifts(scheduled_date)');
  await knex.raw('CREATE INDEX idx_active_open_shifts_priority ON active_open_shifts(priority, is_urgent)');

  // Function to refresh materialized view
  await knex.raw(`
    CREATE OR REPLACE FUNCTION refresh_active_open_shifts()
    RETURNS void AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY active_open_shifts;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Function to calculate distance between two points (Haversine formula)
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_distance(
        lat1 NUMERIC,
        lon1 NUMERIC,
        lat2 NUMERIC,
        lon2 NUMERIC
    ) RETURNS NUMERIC AS $$
    DECLARE
        R NUMERIC := 3959; -- Earth radius in miles
        dLat NUMERIC;
        dLon NUMERIC;
        a NUMERIC;
        c NUMERIC;
    BEGIN
        IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
            RETURN NULL;
        END IF;
        
        dLat := radians(lat2 - lat1);
        dLon := radians(lon2 - lon1);
        
        a := sin(dLat/2) * sin(dLat/2) + 
             cos(radians(lat1)) * cos(radians(lat2)) * 
             sin(dLon/2) * sin(dLon/2);
        
        c := 2 * atan2(sqrt(a), sqrt(1-a));
        
        RETURN R * c;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);

  // Function to check if caregiver is available for a shift
  await knex.raw(`
    CREATE OR REPLACE FUNCTION is_caregiver_available(
        p_caregiver_id UUID,
        p_date DATE,
        p_start_time TIME,
        p_end_time TIME
    ) RETURNS BOOLEAN AS $$
    DECLARE
        conflict_count INTEGER;
    BEGIN
        SELECT COUNT(*)
        INTO conflict_count
        FROM visits
        WHERE assigned_caregiver_id = p_caregiver_id
          AND scheduled_date = p_date
          AND deleted_at IS NULL
          AND status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED')
          AND (
              (scheduled_start_time, scheduled_end_time) OVERLAPS (p_start_time, p_end_time)
          );
        
        RETURN conflict_count = 0;
    END;
    $$ LANGUAGE plpgsql STABLE;
  `);

  // ============================================================================
  // COMMENTS
  // ============================================================================

  await knex.raw(`COMMENT ON TABLE open_shifts IS 'Unassigned visits needing caregiver assignment'`);
  await knex.raw(`COMMENT ON TABLE matching_configurations IS 'Configurable rules and weights for shift matching algorithm'`);
  await knex.raw(`COMMENT ON TABLE assignment_proposals IS 'System-generated or manual caregiver-shift pairing suggestions'`);
  await knex.raw(`COMMENT ON TABLE caregiver_preference_profiles IS 'Caregiver self-service shift and work preferences'`);
  await knex.raw(`COMMENT ON TABLE bulk_match_requests IS 'Batch matching requests for multiple shifts'`);
  await knex.raw(`COMMENT ON TABLE match_history IS 'Audit log of all matching attempts and outcomes'`);
  await knex.raw(`COMMENT ON MATERIALIZED VIEW active_open_shifts IS 'Optimized view of currently unassigned shifts with proposal counts'`);

  await knex.raw(`COMMENT ON COLUMN open_shifts.matching_status IS 'Current state in the matching workflow'`);
  await knex.raw(`COMMENT ON COLUMN open_shifts.fill_by_date IS 'Deadline for assignment - triggers escalation if approaching'`);
  await knex.raw(`COMMENT ON COLUMN assignment_proposals.match_score IS 'Composite score 0-100 indicating caregiver fit'`);
  await knex.raw(`COMMENT ON COLUMN assignment_proposals.match_reasons IS 'JSONB: Detailed reasons contributing to match score'`);
  await knex.raw(`COMMENT ON COLUMN matching_configurations.weights IS 'JSONB: Score weights for eight matching dimensions, must sum to 100'`);
  await knex.raw(`COMMENT ON COLUMN caregiver_preference_profiles.notification_methods IS 'JSONB: Array of preferred notification channels'`);
}

export async function down(knex: Knex): Promise<void> {
  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS is_caregiver_available(UUID, DATE, TIME, TIME)');
  await knex.raw('DROP FUNCTION IF EXISTS calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC)');
  await knex.raw('DROP FUNCTION IF EXISTS refresh_active_open_shifts');
  
  // Drop materialized view
  await knex.raw('DROP MATERIALIZED VIEW IF EXISTS active_open_shifts');
  
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS trigger_proposals_updated_at ON assignment_proposals');
  await knex.raw('DROP FUNCTION IF EXISTS update_proposals_updated_at');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_open_shifts_updated_at ON open_shifts');
  await knex.raw('DROP FUNCTION IF EXISTS update_open_shifts_updated_at');
  
  // Drop tables
  await knex.schema.dropTableIfExists('match_history');
  await knex.schema.dropTableIfExists('bulk_match_requests');
  await knex.schema.dropTableIfExists('caregiver_preference_profiles');
  await knex.schema.dropTableIfExists('assignment_proposals');
  await knex.schema.dropTableIfExists('matching_configurations');
  await knex.schema.dropTableIfExists('open_shifts');
}