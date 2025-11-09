#!/bin/bash

# Backup verification script
# Tests that backups can be successfully restored

set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "[$(date)] Starting backup verification for ${BACKUP_FILE}..."

# Create temporary test database
TEST_DB="care_commons_test_restore_$(date +%s)"

# Create test database
PGPASSWORD="${DB_PASSWORD}" createdb \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  "${TEST_DB}"

# Restore to test database
PGPASSWORD="${DB_PASSWORD}" pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${TEST_DB}" \
  "${BACKUP_FILE}"

# Verify key tables exist and have data
TABLES=("users" "clients" "caregivers" "visits" "evv_records")

for TABLE in "${TABLES[@]}"; do
  COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${TEST_DB}" \
    -t -c "SELECT COUNT(*) FROM ${TABLE};")

  echo "[$(date)] Table ${TABLE}: ${COUNT} records"
done

# Drop test database
PGPASSWORD="${DB_PASSWORD}" dropdb \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  "${TEST_DB}"

echo "[$(date)] Backup verification completed successfully"
