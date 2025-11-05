-- #################################################
-- # 1. DROP ALL TABLES (Dynamic approach)
-- #################################################

-- Drop ALL tables in the public schema dynamically
-- This ensures we catch any tables not explicitly listed
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all materialized views
    FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || quote_ident(r.matviewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequencename) || ' CASCADE';
    END LOOP;
END $$;


-- #################################################
-- # 2. DROP EXTENSIONS FIRST (before dropping functions)
-- #################################################

-- Drop extensions first to avoid dependency issues with extension functions
-- Using CASCADE to handle any remaining dependencies
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;


-- #################################################
-- # 3. DROP CUSTOM FUNCTIONS
-- #################################################

-- Drop all custom functions in the public schema dynamically
-- This will only drop user-created functions (extension functions are already gone)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, 
               p.proname as function,
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.schema) || '.' || quote_ident(r.function) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;
