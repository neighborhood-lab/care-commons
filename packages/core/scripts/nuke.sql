-- #################################################
-- # 1. DROP ALL TABLES (Safely using CASCADE)
-- #################################################

-- Drop tables created in 012_payroll_processing.sql
DROP TABLE IF EXISTS ach_batches CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS pay_stubs CASCADE;
DROP TABLE IF EXISTS caregiver_deductions CASCADE;
DROP TABLE IF EXISTS tax_configurations CASCADE;
DROP TABLE IF EXISTS pay_runs CASCADE;
DROP TABLE IF EXISTS time_sheets CASCADE;
DROP TABLE IF EXISTS pay_periods CASCADE;

-- Drop tables created in 011_add_state_specific_care_plans.sql
DROP TABLE IF EXISTS rn_delegations CASCADE;

-- Drop tables created in 010_state_specific_evv.sql
DROP TABLE IF EXISTS evv_exception_queue CASCADE;
DROP TABLE IF EXISTS state_aggregator_submissions CASCADE;
DROP TABLE IF EXISTS texas_vmur CASCADE;
DROP TABLE IF EXISTS evv_access_log CASCADE;
DROP TABLE IF EXISTS evv_original_data CASCADE;
DROP TABLE IF EXISTS evv_revisions CASCADE;
DROP TABLE IF EXISTS evv_state_config CASCADE;

-- Drop tables created in 009_add_state_specific_fields.sql
DROP TABLE IF EXISTS client_authorizations CASCADE;
DROP TABLE IF EXISTS registry_check_results CASCADE;
DROP TABLE IF EXISTS client_access_audit CASCADE;

-- Drop tables created in 008_billing_invoicing.sql
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS billable_items CASCADE;
DROP TABLE IF EXISTS service_authorizations CASCADE;
DROP TABLE IF EXISTS rate_schedules CASCADE;
DROP TABLE IF EXISTS payers CASCADE;

-- Drop tables created in 007_shift_matching.sql and shift_requirements
DROP TABLE IF EXISTS shift_requirements CASCADE;
DROP MATERIALIZED VIEW IF EXISTS active_open_shifts CASCADE;
DROP TABLE IF EXISTS match_history CASCADE;
DROP TABLE IF EXISTS bulk_match_requests CASCADE;
DROP TABLE IF EXISTS caregiver_preference_profiles CASCADE;
DROP TABLE IF EXISTS assignment_proposals CASCADE;
DROP TABLE IF EXISTS matching_configurations CASCADE;
DROP TABLE IF EXISTS open_shifts CASCADE;

-- Drop tables created in 006_create_care_plans_tables.sql
DROP TABLE IF EXISTS progress_notes CASCADE;
DROP TABLE IF EXISTS task_instances CASCADE;
DROP TABLE IF EXISTS care_plans CASCADE;

-- Drop tables created in 005_create_evv_tables.sql
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS evv_records CASCADE;

-- Drop tables created in 004_scheduling_visits.sql
DROP TABLE IF EXISTS visit_exceptions CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS service_patterns CASCADE;

-- Drop tables created in 003_create_caregivers_table.sql
DROP TABLE IF EXISTS caregivers CASCADE;

-- Drop tables created in 002_create_clients_table.sql
DROP TABLE IF EXISTS clients CASCADE;

-- Drop tables created in 001_create_base_tables.sql
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS audit_revisions CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS invite_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop the migration tracking table itself
DROP TABLE IF EXISTS schema_migrations;

-- Drop Knex migration tracking tables
DROP TABLE IF EXISTS knex_migrations;
DROP TABLE IF EXISTS knex_migrations_lock;


-- #################################################
-- # 2. DROP CUSTOM FUNCTIONS AND EXTENSIONS
-- #################################################

-- Functions created in 012_payroll_processing.sql
DROP FUNCTION IF EXISTS update_payroll_entity_updated_at() CASCADE;

-- Functions created in 011_add_state_specific_care_plans.sql
DROP FUNCTION IF EXISTS update_rn_delegations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_service_authorizations_updated_at() CASCADE;

-- Functions created in 010_state_specific_evv.sql
DROP FUNCTION IF EXISTS update_exception_queue_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_texas_vmur_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_evv_state_config_updated_at() CASCADE;
DROP FUNCTION IF EXISTS set_revision_number() CASCADE;

-- Functions created in 009_add_state_specific_fields.sql
DROP FUNCTION IF EXISTS calculate_remaining_units() CASCADE;

-- Functions created in 008_billing_invoicing.sql
DROP FUNCTION IF EXISTS update_billing_entity_updated_at() CASCADE;

-- Functions created in 007_shift_matching.sql
DROP FUNCTION IF EXISTS is_caregiver_available() CASCADE;
DROP FUNCTION IF EXISTS calculate_distance() CASCADE;
DROP FUNCTION IF EXISTS refresh_active_open_shifts() CASCADE;

-- Functions created in 006_create_care_plans_tables.sql
DROP FUNCTION IF EXISTS update_progress_notes_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_task_instances_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_care_plans_updated_at() CASCADE;

-- Functions created in 005_create_evv_tables.sql
DROP FUNCTION IF EXISTS update_geofences_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_time_entries_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_evv_records_updated_at() CASCADE;

-- Functions created in clients/caregivers/visits/patterns migrations
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_credential_expiration() CASCADE;
DROP FUNCTION IF EXISTS update_patterns_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_visits_updated_at() CASCADE;

-- The extensions themselves (if you want a *complete* reset)
-- NOTE: You may not need to drop extensions, but including for completeness.
-- Using CASCADE to handle any remaining dependencies
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
