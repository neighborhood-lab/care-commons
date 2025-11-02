import type { Knex } from 'knex';

/**
 * Performance Optimization Migration
 * 
 * This migration adds composite and specialized indexes to optimize common query patterns:
 * 
 * 1. Shift Matching Optimizations:
 *    - Composite indexes on open_shifts for common filter combinations
 *    - Optimized indexes for visit lookups and calendar queries
 * 
 * 2. Tenant-Scoped Query Optimizations:
 *    - Composite indexes on users, visits for organization + status queries
 * 
 * 3. JSONB Query Optimizations:
 *    - GIN indexes for frequently queried JSONB fields (settings, state_specific)
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // OPEN SHIFTS - Composite Indexes for Common Filter Combinations
  // ============================================================================
  
  // Optimize searchOpenShifts queries with organization + date range + status filters
  await knex.raw(`
    CREATE INDEX idx_open_shifts_org_date_status 
    ON open_shifts(organization_id, scheduled_date, matching_status) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize queries filtering by branch + date range + status
  await knex.raw(`
    CREATE INDEX idx_open_shifts_branch_date_status 
    ON open_shifts(branch_id, scheduled_date, matching_status) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize urgent shift queries with priority and date
  await knex.raw(`
    CREATE INDEX idx_open_shifts_priority_date_status 
    ON open_shifts(priority DESC, scheduled_date ASC, matching_status) 
    WHERE is_urgent = true AND matching_status NOT IN ('ASSIGNED', 'EXPIRED')
  `);
  
  // Optimize queries by organization + priority + status (for dashboard views)
  await knex.raw(`
    CREATE INDEX idx_open_shifts_org_priority_status 
    ON open_shifts(organization_id, priority DESC, matching_status) 
    WHERE deleted_at IS NULL AND matching_status IN ('NEW', 'MATCHING', 'NO_MATCH', 'PROPOSED')
  `);
  
  // Optimize client-specific shift lookups
  await knex.raw(`
    CREATE INDEX idx_open_shifts_client_date 
    ON open_shifts(client_id, scheduled_date DESC) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize service type filtering (common in matching algorithms)
  await knex.raw(`
    CREATE INDEX idx_open_shifts_service_type_date 
    ON open_shifts(service_type_id, scheduled_date) 
    WHERE matching_status IN ('NEW', 'MATCHING', 'NO_MATCH')
  `);

  // ============================================================================
  // USERS - Composite Indexes for Tenant-Scoped Queries
  // ============================================================================
  
  // Optimize queries filtering by organization + status + deleted_at
  await knex.raw(`
    CREATE INDEX idx_users_org_status_active 
    ON users(organization_id, status) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize branch-scoped user queries
  await knex.raw(`
    CREATE INDEX idx_users_branches_status 
    ON users USING GIN(branch_ids) 
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // ============================================================================
  // VISITS - Composite Indexes for Calendar and Scheduling Queries
  // ============================================================================
  
  // Optimize calendar queries by organization + date range
  await knex.raw(`
    CREATE INDEX idx_visits_org_date_active 
    ON visits(organization_id, scheduled_date) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize caregiver schedule queries (date + time for conflict detection)
  await knex.raw(`
    CREATE INDEX idx_visits_caregiver_schedule 
    ON visits(assigned_caregiver_id, scheduled_date, scheduled_start_time, scheduled_end_time) 
    WHERE deleted_at IS NULL AND status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED')
  `);
  
  // Optimize client visit history queries
  await knex.raw(`
    CREATE INDEX idx_visits_client_date_desc 
    ON visits(client_id, scheduled_date DESC) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize unassigned visit queries for shift matching
  await knex.raw(`
    CREATE INDEX idx_visits_unassigned_date 
    ON visits(organization_id, scheduled_date, branch_id) 
    WHERE deleted_at IS NULL AND assigned_caregiver_id IS NULL AND status = 'UNASSIGNED'
  `);
  
  // Optimize visit status queries by branch
  await knex.raw(`
    CREATE INDEX idx_visits_branch_status_date 
    ON visits(branch_id, status, scheduled_date) 
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // ASSIGNMENT PROPOSALS - Optimize Proposal Lookups
  // ============================================================================
  
  // Optimize caregiver proposal queries (ordered by date)
  await knex.raw(`
    CREATE INDEX idx_proposals_caregiver_status_date 
    ON assignment_proposals(caregiver_id, proposal_status, proposed_at DESC) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize open shift proposal queries (ordered by match score)
  await knex.raw(`
    CREATE INDEX idx_proposals_shift_score 
    ON assignment_proposals(open_shift_id, match_score DESC, proposed_at ASC) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize pending proposal expiration queries
  await knex.raw(`
    CREATE INDEX idx_proposals_expiration 
    ON assignment_proposals(sent_at, proposal_status) 
    WHERE deleted_at IS NULL AND proposal_status IN ('SENT', 'VIEWED', 'PENDING')
  `);

  // ============================================================================
  // MATCHING CONFIGURATIONS - Optimize Config Lookups
  // ============================================================================
  
  // Optimize default configuration queries
  await knex.raw(`
    CREATE INDEX idx_matching_config_default 
    ON matching_configurations(organization_id, branch_id, is_default, is_active) 
    WHERE is_default = true AND is_active = true
  `);

  // ============================================================================
  // JSONB FIELDS - GIN Indexes for Settings and State-Specific Data
  // ============================================================================
  
  // Organizations settings queries
  await knex.raw(`
    CREATE INDEX idx_organizations_settings_gin 
    ON organizations USING GIN(settings) 
    WHERE deleted_at IS NULL
  `);
  
  // Branches settings queries
  await knex.raw(`
    CREATE INDEX idx_branches_settings_gin 
    ON branches USING GIN(settings) 
    WHERE deleted_at IS NULL
  `);
  
  // Users settings queries (notification preferences, UI settings, etc.)
  await knex.raw(`
    CREATE INDEX idx_users_settings_gin 
    ON users USING GIN(settings) 
    WHERE deleted_at IS NULL
  `);
  
  // Clients state_specific data queries
  await knex.raw(`
    CREATE INDEX idx_clients_state_specific_gin 
    ON clients USING GIN(state_specific_data) 
    WHERE deleted_at IS NULL
  `);
  
  // Caregivers state_specific data queries
  await knex.raw(`
    CREATE INDEX idx_caregivers_state_specific_gin 
    ON caregivers USING GIN(state_specific_data) 
    WHERE deleted_at IS NULL
  `);
  
  // Visits state_specific data queries
  await knex.raw(`
    CREATE INDEX idx_visits_state_specific_gin 
    ON visits USING GIN(state_specific_data) 
    WHERE deleted_at IS NULL
  `);
  
  // Open shifts JSONB arrays for caregiver matching
  await knex.raw(`
    CREATE INDEX idx_open_shifts_required_skills_gin 
    ON open_shifts USING GIN(required_skills)
  `);
  
  await knex.raw(`
    CREATE INDEX idx_open_shifts_required_certifications_gin 
    ON open_shifts USING GIN(required_certifications)
  `);
  
  await knex.raw(`
    CREATE INDEX idx_open_shifts_preferred_caregivers_gin 
    ON open_shifts USING GIN(preferred_caregivers)
  `);

  // Caregiver preference profiles JSONB fields
  await knex.raw(`
    CREATE INDEX idx_caregiver_prefs_days_gin 
    ON caregiver_preference_profiles USING GIN(preferred_days_of_week)
  `);
  
  await knex.raw(`
    CREATE INDEX idx_caregiver_prefs_time_ranges_gin 
    ON caregiver_preference_profiles USING GIN(preferred_time_ranges)
  `);

  // ============================================================================
  // ADDITIONAL OPTIMIZATIONS - Covering Indexes
  // ============================================================================
  
  // Optimize the common JOIN in createOpenShift (visits + service_patterns)
  await knex.raw(`
    CREATE INDEX idx_visits_pattern_join 
    ON visits(id, pattern_id) 
    INCLUDE (organization_id, branch_id, client_id, scheduled_date, scheduled_start_time, 
             scheduled_end_time, scheduled_duration, timezone, service_type_id, service_type_name, 
             address, task_ids, required_skills, required_certifications, client_instructions) 
    WHERE deleted_at IS NULL
  `);
  
  // Optimize service pattern lookups for visit creation
  await knex.raw(`
    CREATE INDEX idx_service_patterns_id_preferences 
    ON service_patterns(id) 
    INCLUDE (preferred_caregivers, blocked_caregivers, gender_preference, language_preference) 
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all indexes in reverse order
  
  // Service patterns
  await knex.raw('DROP INDEX IF EXISTS idx_service_patterns_id_preferences');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_pattern_join');
  
  // Caregiver preferences
  await knex.raw('DROP INDEX IF EXISTS idx_caregiver_prefs_time_ranges_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_caregiver_prefs_days_gin');
  
  // Open shifts JSONB
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_preferred_caregivers_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_required_certifications_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_required_skills_gin');
  
  // State-specific data
  await knex.raw('DROP INDEX IF EXISTS idx_visits_state_specific_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_state_specific_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_clients_state_specific_gin');
  
  // Settings
  await knex.raw('DROP INDEX IF EXISTS idx_users_settings_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_branches_settings_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_organizations_settings_gin');
  
  // Matching configurations
  await knex.raw('DROP INDEX IF EXISTS idx_matching_config_default');
  
  // Assignment proposals
  await knex.raw('DROP INDEX IF EXISTS idx_proposals_expiration');
  await knex.raw('DROP INDEX IF EXISTS idx_proposals_shift_score');
  await knex.raw('DROP INDEX IF EXISTS idx_proposals_caregiver_status_date');
  
  // Visits
  await knex.raw('DROP INDEX IF EXISTS idx_visits_branch_status_date');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_unassigned_date');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_client_date_desc');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_caregiver_schedule');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_org_date_active');
  
  // Users
  await knex.raw('DROP INDEX IF EXISTS idx_users_branches_status');
  await knex.raw('DROP INDEX IF EXISTS idx_users_org_status_active');
  
  // Open shifts
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_service_type_date');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_client_date');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_org_priority_status');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_priority_date_status');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_branch_date_status');
  await knex.raw('DROP INDEX IF EXISTS idx_open_shifts_org_date_status');
}
