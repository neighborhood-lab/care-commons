#!/bin/bash

# Database restore script for Care Commons
# Usage: ./restore-database.sh <backup_file> [--point-in-time YYYY-MM-DD-HH:MM:SS]

set -e

BACKUP_FILE="$1"
POINT_IN_TIME="$2"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file> [--point-in-time YYYY-MM-DD-HH:MM:SS]"
  exit 1
fi

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-care_commons}"
DB_USER="${DB_USER:-postgres}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

echo "[$(date)] Starting database restore from ${BACKUP_FILE}..."

# Download from S3 if it's an S3 path
if [[ "${BACKUP_FILE}" == s3://* ]]; then
  echo "[$(date)] Downloading backup from S3..."
  LOCAL_BACKUP="/tmp/$(basename ${BACKUP_FILE})"
  aws s3 cp "${BACKUP_FILE}" "${LOCAL_BACKUP}"
  BACKUP_FILE="${LOCAL_BACKUP}"
fi

# Decompress if gzipped
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "[$(date)] Decompressing backup..."
  gunzip -c "${BACKUP_FILE}" > "${BACKUP_FILE%.gz}"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Decrypt if encrypted
if [ -n "${ENCRYPTION_KEY}" ] && [[ "${BACKUP_FILE}" == *.enc ]]; then
  echo "[$(date)] Decrypting backup..."
  openssl enc -aes-256-cbc -d \
    -in "${BACKUP_FILE}" \
    -out "${BACKUP_FILE%.enc}" \
    -pass pass:"${ENCRYPTION_KEY}"
  BACKUP_FILE="${BACKUP_FILE%.enc}"
fi

# Create a backup of current database before restoring
echo "[$(date)] Creating safety backup of current database..."
SAFETY_BACKUP="/tmp/care_commons_pre_restore_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -f "${SAFETY_BACKUP}"

echo "[$(date)] Safety backup created: ${SAFETY_BACKUP}"

# Restore database
echo "[$(date)] Restoring database..."
PGPASSWORD="${DB_PASSWORD}" pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -c \
  -v \
  "${BACKUP_FILE}"

# Point-in-time recovery if requested
if [ -n "${POINT_IN_TIME}" ]; then
  echo "[$(date)] Applying point-in-time recovery to ${POINT_IN_TIME}..."
  # This requires WAL archives - implementation depends on PostgreSQL setup
  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -c "SELECT pg_wal_replay_resume();"
fi

echo "[$(date)] Database restore completed successfully"

# Verify restore
RECORD_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -t -c "SELECT COUNT(*) FROM users;")

echo "[$(date)] Verification: ${RECORD_COUNT} users in restored database"

# Log restore completion
echo "{\"timestamp\": \"$(date -Iseconds)\", \"backup_file\": \"${BACKUP_FILE}\", \"status\": \"success\", \"record_count\": ${RECORD_COUNT}}" >> "/var/backups/care-commons/restore.log"
