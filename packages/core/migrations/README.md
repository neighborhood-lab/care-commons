# Database Migrations

This directory contains both TypeScript and SQL migrations for the Care Commons
database schema.

## Migration Status

### TypeScript Migrations (Active)

- ✅ `20251029214712_create_base_tables.ts` - Creates base tables
  (organizations, branches, users, audit_events, audit_revisions, programs)

### SQL Migrations (Legacy - To Be Migrated)

The following SQL migrations are still active and required. They will be
converted to TypeScript migrations in future updates:

- ⚠️ `002_create_clients_table.sql` - Client demographics table
- ⚠️ `003_create_caregivers_table.sql` - Caregiver/staff table
- ⚠️ `004_scheduling_visits.sql` - Scheduling and visits tables
- ⚠️ `005_create_evv_tables.sql` - Electronic Visit Verification tables
- ✅ `20251030214716_care_plans_tables.ts` - Care plans, tasks, and progress
  notes tables (TypeScript migration)
- ~~❌ `006_create_care_plans_tables.sql` - DEPRECATED (replaced by TypeScript
  migration)~~
- ⚠️ `007_shift_matching.sql` - Shift matching and open shifts tables
- ⚠️ `008_billing_invoicing.sql` - Billing and invoicing tables
- ⚠️ `009_add_state_specific_fields.sql` - State-specific compliance fields
- ⚠️ `010_state_specific_evv.sql` - State-specific EVV requirements (TX/FL)
- ⚠️ `011_add_state_specific_care_plans.sql` - State-specific care plan features
- ⚠️ `012_payroll_processing.sql` - Payroll processing tables

## Running Migrations

All migrations are managed through Knex. The system will automatically run both
TypeScript and SQL migrations in order.

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback last migration batch
npm run db:migrate:rollback

# Completely reset database (DESTRUCTIVE!)
npm run db:nuke
```

## Environment Configuration

All database scripts respect the `.env` configuration:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: care_commons)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password
- `DB_SSL` - Enable SSL (default: false)

## Migration Notes

### Removed Migrations

- ❌ `001_create_base_tables.sql` - Superseded by TypeScript migration
  `20251029214712_create_base_tables.ts`

### Future Work

The remaining SQL migrations (002-012) should be converted to TypeScript format
for better type safety and maintainability. Each migration should:

1. Use Knex schema builder syntax
2. Include proper `up()` and `down()` functions
3. Follow the timestamp naming convention
4. Be tested independently
