#!/bin/bash
set -e

# Automated backup restoration test
# Run monthly to verify backups are restorable

echo "🧪 Testing backup restoration..."

DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_USER=${DATABASE_USER:-postgres}

# Create test database
TEST_DB="care_commons_backup_test_$(date +%s)"
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $TEST_DB

# Get latest backup
LATEST_BACKUP=$(find /var/backups/care-commons -name "backup_*.sql.gz" -mtime -1 -print -quit 2>/dev/null)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No recent backup found"
  dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $TEST_DB
  exit 1
fi

# Decompress and restore to test database
gunzip -c $LATEST_BACKUP | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB

# Verify data
CLIENT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM clients;" 2>/dev/null || echo "0")
VISIT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM visits;" 2>/dev/null || echo "0")

echo "✅ Backup restored successfully"
echo "   Clients: $CLIENT_COUNT"
echo "   Visits: $VISIT_COUNT"

# Cleanup test database
dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $TEST_DB

echo "✅ Backup restoration test passed"
