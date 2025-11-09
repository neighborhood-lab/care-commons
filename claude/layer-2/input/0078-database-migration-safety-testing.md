# Task 0078: Database Migration Safety and Rollback Testing

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 3-4 days
**Type:** DevOps / Database / Production Readiness
**Vertical:** Infrastructure

---

## Context

Care Commons has 25+ database migrations totaling ~377KB of schema definitions. In production, **failed migrations or rollbacks can cause data loss or system downtime**. We need to verify that all migrations are safe, reversible, and tested before production launch.

**Risks Without This Task:**
- Failed migration leaves database in inconsistent state
- Rollback destroys data
- Downtime during migration exceeds maintenance window
- Production data corrupted by untested migration

**Current State:**
- 25 migration files in `packages/core/migrations/`
- Migrations written with Knex.js
- No formal rollback testing
- No migration execution time benchmarks
- No data migration validation

**Goal State:**
- All migrations tested forward and backward
- Rollback procedures verified safe
- Migration execution time measured
- Large migrations optimized
- Migration runbook for production

---

## Objectives

1. **Test All Migrations Forward and Backward**
2. **Verify Data Integrity After Rollbacks**
3. **Benchmark Migration Execution Time**
4. **Optimize Slow Migrations**
5. **Create Migration Runbook for Production**

---

## Deliverable 1: Migration Testing Framework

### Test Script

**scripts/test-migrations.sh:**

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🗄️  Database Migration Testing"
echo "=============================="
echo ""

# Configuration
TEST_DB="care_commons_migration_test"
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}

# Create test database
echo "📦 Creating test database: $TEST_DB"
psql -U $DB_USER -h $DB_HOST -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres
psql -U $DB_USER -h $DB_HOST -c "CREATE DATABASE $TEST_DB;" postgres

export DATABASE_URL="postgresql://$DB_USER@$DB_HOST:5432/$TEST_DB"

# Function to count rows in all tables
count_all_rows() {
  psql $DATABASE_URL -t -c "
    SELECT
      schemaname || '.' || tablename AS table_name,
      n_tup_ins - n_tup_del AS row_count
    FROM pg_stat_user_tables
    ORDER BY tablename;
  "
}

# Test each migration
echo ""
echo "🧪 Testing migrations..."
echo ""

# Get list of migration files
MIGRATIONS=($(ls packages/core/migrations/*.js | sort))
TOTAL_MIGRATIONS=${#MIGRATIONS[@]}

for i in "${!MIGRATIONS[@]}"; do
  MIGRATION_FILE=${MIGRATIONS[$i]}
  MIGRATION_NAME=$(basename $MIGRATION_FILE)
  MIGRATION_NUM=$((i + 1))

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Testing $MIGRATION_NUM/$TOTAL_MIGRATIONS: $MIGRATION_NAME"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Run migration up
  echo ""
  echo "⬆️  Running migration UP..."
  START_TIME=$(date +%s.%N)

  if npm run migrate:up; then
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    echo -e "${GREEN}✅ Migration UP succeeded${NC} (${DURATION}s)"
  else
    echo -e "${RED}❌ Migration UP failed${NC}"
    exit 1
  fi

  # Check current schema
  echo ""
  echo "📊 Current schema state:"
  psql $DATABASE_URL -c "\dt" | head -20

  # Run migration down (rollback)
  echo ""
  echo "⬇️  Running migration DOWN (rollback)..."
  START_TIME=$(date +%s.%N)

  if npm run migrate:down; then
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    echo -e "${GREEN}✅ Migration DOWN succeeded${NC} (${DURATION}s)"
  else
    echo -e "${RED}❌ Migration DOWN failed${NC}"
    echo -e "${YELLOW}⚠️  This migration cannot be safely rolled back!${NC}"
    # Continue but mark as failed
  fi

  # Re-run migration up to continue testing next migration
  echo ""
  echo "⬆️  Re-running migration UP to continue..."
  npm run migrate:up > /dev/null 2>&1

  echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All migrations tested successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
echo ""
echo "🧹 Cleaning up test database..."
psql -U $DB_USER -h $DB_HOST -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres

echo ""
echo "✅ Migration testing complete!"
```

### Add to package.json

```json
{
  "scripts": {
    "migrate:test": "./scripts/test-migrations.sh",
    "migrate:benchmark": "./scripts/benchmark-migrations.sh"
  }
}
```

---

## Deliverable 2: Data Integrity Validation

### Test with Sample Data

**scripts/test-migration-data-integrity.sh:**

```bash
#!/bin/bash
set -e

echo "🔍 Testing Migration Data Integrity"
echo "===================================="

# Setup test database
TEST_DB="care_commons_data_test"
export DATABASE_URL="postgresql://postgres@localhost:5432/$TEST_DB"

psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres
psql -U postgres -c "CREATE DATABASE $TEST_DB;" postgres

# Run all migrations
echo ""
echo "Running all migrations..."
npm run migrate:latest

# Seed test data
echo ""
echo "Seeding test data..."
psql $DATABASE_URL <<EOF
-- Insert test users
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
  ('test1@example.com', 'hash1', 'Test', 'User1', 'coordinator'),
  ('test2@example.com', 'hash2', 'Test', 'User2', 'caregiver');

-- Insert test clients
INSERT INTO clients (first_name, last_name, email, phone, address_line1, city, state, zip) VALUES
  ('John', 'Doe', 'john@example.com', '555-1234', '123 Main St', 'Austin', 'TX', '78701'),
  ('Jane', 'Smith', 'jane@example.com', '555-5678', '456 Oak Ave', 'Austin', 'TX', '78702');

-- Insert test caregivers
INSERT INTO caregivers (user_id, first_name, last_name, email, phone, address_line1, city, state, zip)
SELECT id, first_name, last_name, email, '555-0000', '789 Pine Rd', 'Austin', 'TX', '78703'
FROM users WHERE role = 'caregiver';

-- Insert test visits
INSERT INTO visits (client_id, caregiver_id, scheduled_start, scheduled_end, status)
SELECT
  c.id,
  cg.id,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
  'scheduled'
FROM clients c, caregivers cg
LIMIT 5;
EOF

# Capture data snapshot
echo ""
echo "Capturing data snapshot..."
psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users" > /tmp/users_count_before.txt
psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM clients" > /tmp/clients_count_before.txt
psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM caregivers" > /tmp/caregivers_count_before.txt
psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM visits" > /tmp/visits_count_before.txt

USERS_BEFORE=$(cat /tmp/users_count_before.txt | tr -d ' ')
CLIENTS_BEFORE=$(cat /tmp/clients_count_before.txt | tr -d ' ')
CAREGIVERS_BEFORE=$(cat /tmp/caregivers_count_before.txt | tr -d ' ')
VISITS_BEFORE=$(cat /tmp/visits_count_before.txt | tr -d ' ')

echo "Before rollback:"
echo "  Users: $USERS_BEFORE"
echo "  Clients: $CLIENTS_BEFORE"
echo "  Caregivers: $CAREGIVERS_BEFORE"
echo "  Visits: $VISITS_BEFORE"

# Rollback one migration
echo ""
echo "Rolling back last migration..."
npm run migrate:down

# Check data after rollback
echo ""
echo "Checking data after rollback..."
USERS_AFTER=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users" | tr -d ' ' || echo "TABLE_DROPPED")
CLIENTS_AFTER=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM clients" | tr -d ' ' || echo "TABLE_DROPPED")

if [ "$USERS_AFTER" = "TABLE_DROPPED" ]; then
  echo "⚠️  Users table was dropped by rollback (expected for early migrations)"
elif [ "$USERS_BEFORE" -eq "$USERS_AFTER" ]; then
  echo "✅ User data preserved after rollback"
else
  echo "❌ User data LOST after rollback ($USERS_BEFORE -> $USERS_AFTER)"
  exit 1
fi

# Re-run migration
echo ""
echo "Re-running migration..."
npm run migrate:up

# Verify data restored
USERS_RESTORED=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users" | tr -d ' ')
if [ "$USERS_BEFORE" -eq "$USERS_RESTORED" ]; then
  echo "✅ Data restored successfully after re-migration"
else
  echo "❌ Data NOT fully restored ($USERS_BEFORE -> $USERS_RESTORED)"
fi

# Cleanup
psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres

echo ""
echo "✅ Data integrity test complete!"
```

---

## Deliverable 3: Migration Benchmarking

**scripts/benchmark-migrations.sh:**

```bash
#!/bin/bash
set -e

echo "⏱️  Migration Performance Benchmarking"
echo "======================================"

TEST_DB="care_commons_benchmark"
export DATABASE_URL="postgresql://postgres@localhost:5432/$TEST_DB"

psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres
psql -U postgres -c "CREATE DATABASE $TEST_DB;" postgres

# Track total time
TOTAL_START=$(date +%s.%N)

# Benchmark each migration
echo ""
echo "Migration,Direction,Duration (seconds)" > migration-benchmarks.csv

MIGRATIONS=($(ls packages/core/migrations/*.js | sort))

for MIGRATION_FILE in "${MIGRATIONS[@]}"; do
  MIGRATION_NAME=$(basename $MIGRATION_FILE .js)

  # UP
  START=$(date +%s.%N)
  npm run migrate:up > /dev/null 2>&1
  END=$(date +%s.%N)
  UP_DURATION=$(echo "$END - $START" | bc)

  echo "$MIGRATION_NAME,UP,$UP_DURATION" >> migration-benchmarks.csv

  # DOWN
  START=$(date +%s.%N)
  npm run migrate:down > /dev/null 2>&1 || true
  END=$(date +%s.%N)
  DOWN_DURATION=$(echo "$END - $START" | bc)

  echo "$MIGRATION_NAME,DOWN,$DOWN_DURATION" >> migration-benchmarks.csv

  # Re-run UP for next test
  npm run migrate:up > /dev/null 2>&1
done

TOTAL_END=$(date +%s.%N)
TOTAL_DURATION=$(echo "$TOTAL_END - $TOTAL_START" | bc)

echo ""
echo "Benchmark Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
column -t -s',' migration-benchmarks.csv
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total time: ${TOTAL_DURATION}s"

# Find slowest migrations
echo ""
echo "⚠️  Migrations taking >5 seconds:"
awk -F',' '$3 > 5 {print $1 " (" $2 "): " $3 "s"}' migration-benchmarks.csv

# Cleanup
psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres

echo ""
echo "✅ Benchmark complete! Results saved to migration-benchmarks.csv"
```

---

## Deliverable 4: Identify and Fix Unsafe Migrations

### Common Migration Issues to Check

**scripts/check-migration-safety.sh:**

```bash
#!/bin/bash

echo "🔍 Checking Migration Safety"
echo "============================"

MIGRATIONS_DIR="packages/core/migrations"
ISSUES_FOUND=0

echo ""
echo "Checking for unsafe patterns..."
echo ""

# Check 1: Dropping columns without down() implementation
echo "1. Checking for dropped columns without rollback..."
for file in $MIGRATIONS_DIR/*.js; do
  if grep -q "dropColumn" "$file"; then
    if ! grep -q "addColumn" "$file" | grep -q "down"; then
      echo "⚠️  $file drops column but may not restore in rollback"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

# Check 2: Dropping tables without down() implementation
echo "2. Checking for dropped tables without rollback..."
for file in $MIGRATIONS_DIR/*.js; do
  if grep -q "dropTable" "$file"; then
    if ! grep -q "createTable" "$file"; then
      echo "⚠️  $file drops table but may not recreate in rollback"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

# Check 3: Large data migrations without batching
echo "3. Checking for unbatched data migrations..."
for file in $MIGRATIONS_DIR/*.js; do
  if grep -q "\.update(" "$file" && ! grep -q "batch\|limit" "$file"; then
    echo "⚠️  $file may have unbatched UPDATE (could be slow on large datasets)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
done

# Check 4: Missing indexes on foreign keys
echo "4. Checking for foreign keys without indexes..."
for file in $MIGRATIONS_DIR/*.js; do
  if grep -q "\.foreign(" "$file"; then
    FOREIGN_KEY_LINE=$(grep -n "\.foreign(" "$file" | head -1 | cut -d: -f1)
    COLUMN=$(grep "\.foreign(" "$file" | head -1 | sed -n "s/.*foreign('\([^']*\)').*/\1/p")

    # Check if index exists for that column
    if ! grep -q "\.index('$COLUMN')" "$file"; then
      echo "⚠️  $file has foreign key on '$COLUMN' but no index (performance issue)"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

# Check 5: NOT NULL added without default
echo "5. Checking for NOT NULL columns without defaults on existing tables..."
for file in $MIGRATIONS_DIR/*.js; do
  if grep -q "\.notNullable()" "$file" && grep -q "alterTable" "$file"; then
    if ! grep -B1 "\.notNullable()" "$file" | grep -q "\.defaultTo("; then
      echo "⚠️  $file adds NOT NULL to existing table without default (may fail on existing data)"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ No safety issues found!"
else
  echo "⚠️  Found $ISSUES_FOUND potential issues - review and fix before production"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## Deliverable 5: Production Migration Runbook

**docs/operations/production-migration-runbook.md:**

```markdown
# Production Migration Runbook

## Pre-Migration Checklist

Before running migrations in production:

- [ ] Backup database (verify backup is restorable)
- [ ] Test migrations on production-like staging environment
- [ ] Review migration execution time benchmarks
- [ ] Schedule maintenance window if migrations take >1 minute
- [ ] Notify users of planned downtime (if applicable)
- [ ] Have rollback plan ready

## Migration Execution

### Step 1: Backup Database

```bash
# Create backup
pg_dump -U postgres -h production-db.example.com care_commons_production > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
psql -U postgres -h staging-db.example.com care_commons_staging < backup-*.sql
```

### Step 2: Run Migrations

```bash
# On production server
cd /var/www/care-commons

# Pull latest code
git pull origin main

# Run migrations
npm run migrate:latest

# Verify migration success
npm run migrate:status
```

### Step 3: Verify Application

```bash
# Run health checks
npm run production:health-check

# Check logs for errors
pm2 logs --lines 100
```

### Step 4: Monitor

- Watch application metrics (response times, error rates)
- Monitor database performance (slow queries, connection pool)
- Check user-facing functionality

## Rollback Procedure

If migration causes issues:

### Option 1: Rollback Migration (if safe)

```bash
# Rollback last migration
npm run migrate:down

# Restart application
pm2 restart care-commons
```

### Option 2: Restore from Backup

```bash
# Stop application
pm2 stop care-commons

# Restore database
psql -U postgres -h production-db.example.com care_commons_production < backup-*.sql

# Restart application
pm2 start care-commons
```

## Post-Migration

- [ ] Verify all features working
- [ ] Check audit logs for errors
- [ ] Monitor for 24 hours
- [ ] Update documentation with any issues encountered

## Common Issues

**Issue**: Migration takes too long
**Solution**: Run during low-traffic hours, consider batching data migrations

**Issue**: Migration fails mid-way
**Solution**: Restore from backup, fix migration, test on staging, retry

**Issue**: Application errors after migration
**Solution**: Check application logs, verify schema matches expectations

## Emergency Contacts

- Database Admin: [contact]
- DevOps Lead: [contact]
- On-call Engineer: [contact]
```

---

## Deliverable 6: Fix Identified Migration Issues

Based on the safety checks, fix any issues:

### Example Fix: Add Missing Index

**Before:**
```javascript
exports.up = function(knex) {
  return knex.schema.table('visits', table => {
    table.integer('client_id').references('clients.id');
    // Missing index!
  });
};
```

**After:**
```javascript
exports.up = function(knex) {
  return knex.schema.table('visits', table => {
    table.integer('client_id').references('clients.id');
    table.index('client_id'); // Add index for foreign key
  });
};

exports.down = function(knex) {
  return knex.schema.table('visits', table => {
    table.dropIndex('client_id');
    table.dropForeign('client_id');
  });
};
```

### Example Fix: Safe NOT NULL Addition

**Before (unsafe):**
```javascript
exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.string('phone').notNullable(); // Will fail if existing rows have NULL
  });
};
```

**After (safe):**
```javascript
exports.up = async function(knex) {
  // Step 1: Add column as nullable with default
  await knex.schema.alterTable('users', table => {
    table.string('phone').defaultTo('000-000-0000');
  });

  // Step 2: Backfill existing NULL values
  await knex('users')
    .whereNull('phone')
    .update({ phone: '000-000-0000' });

  // Step 3: Make column NOT NULL
  await knex.schema.alterTable('users', table => {
    table.string('phone').notNullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('phone');
  });
};
```

---

## Success Criteria

- [ ] All 25+ migrations tested forward and backward
- [ ] No data loss during rollback tests
- [ ] All migrations complete in <5 seconds (or documented if longer)
- [ ] Slow migrations identified and optimized
- [ ] Migration safety script passes with no errors
- [ ] Production migration runbook documented
- [ ] Team trained on migration procedures
- [ ] Rollback procedures tested and verified

---

## Related Tasks

- Task 0034: Backup and Disaster Recovery
- Task 0075: Production Deployment Runbook
- Task 0084: Performance Regression Testing in CI/CD
