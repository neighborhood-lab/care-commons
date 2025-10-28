-- #################################################
-- # 1. DROP ALL TABLES (Safely using CASCADE)
-- #################################################

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
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop the migration tracking table itself
DROP TABLE IF EXISTS schema_migrations;


-- #################################################
-- # 2. DROP CUSTOM FUNCTIONS AND EXTENSIONS
-- #################################################

-- Functions created in clients/caregivers/visits/patterns migrations
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_credential_expiration() CASCADE;
DROP FUNCTION IF EXISTS update_patterns_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_visits_updated_at() CASCADE;

-- The extensions themselves (if you want a *complete* reset)
-- NOTE: You may not need to drop extensions, but including for completeness.
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "pgcrypto";
