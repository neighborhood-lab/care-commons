#!/bin/bash

# Database backup script for Care Commons
# Run daily via cron: 0 2 * * * /path/to/backup-database.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/care-commons}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Database config from environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-care_commons}"
DB_USER="${DB_USER:-postgres}"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="care_commons_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# Create database dump with pg_dump
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_PATH}.tmp"

# Verify backup was created
if [ ! -f "${BACKUP_PATH}.tmp" ]; then
  echo "[$(date)] ERROR: Backup file not created"
  exit 1
fi

# Encrypt backup if encryption key provided
if [ -n "${ENCRYPTION_KEY}" ]; then
  echo "[$(date)] Encrypting backup..."
  openssl enc -aes-256-cbc -salt \
    -in "${BACKUP_PATH}.tmp" \
    -out "${BACKUP_PATH}.enc" \
    -pass pass:"${ENCRYPTION_KEY}"

  rm "${BACKUP_PATH}.tmp"
  mv "${BACKUP_PATH}.enc" "${BACKUP_PATH}"
else
  mv "${BACKUP_PATH}.tmp" "${BACKUP_PATH}"
fi

# Compress backup
echo "[$(date)] Compressing backup..."
gzip "${BACKUP_PATH}"
BACKUP_PATH="${BACKUP_PATH}.gz"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE}.gz (${BACKUP_SIZE})"

# Upload to S3 if configured
if [ -n "${S3_BUCKET}" ]; then
  echo "[$(date)] Uploading to S3..."
  aws s3 cp "${BACKUP_PATH}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}.gz" \
    --storage-class STANDARD_IA

  if [ $? -eq 0 ]; then
    echo "[$(date)] Backup uploaded to S3 successfully"
  else
    echo "[$(date)] ERROR: Failed to upload backup to S3"
    exit 1
  fi
fi

# Remove old backups (keep only RETENTION_DAYS)
echo "[$(date)] Cleaning up old backups (keeping ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "care_commons_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Remove old S3 backups if configured
if [ -n "${S3_BUCKET}" ]; then
  aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
    FILEDATE=$(echo "$line" | awk '{print $1}')
    FILENAME=$(echo "$line" | awk '{print $4}')
    FILEAGE=$(( ($(date +%s) - $(date -d "$FILEDATE" +%s)) / 86400 ))

    if [ $FILEAGE -gt $RETENTION_DAYS ]; then
      aws s3 rm "s3://${S3_BUCKET}/backups/${FILENAME}"
      echo "[$(date)] Removed old S3 backup: ${FILENAME}"
    fi
  done
fi

echo "[$(date)] Backup completed successfully"

# Log backup completion
echo "{\"timestamp\": \"$(date -Iseconds)\", \"backup_file\": \"${BACKUP_FILE}.gz\", \"size\": \"${BACKUP_SIZE}\", \"status\": \"success\"}" >> "${BACKUP_DIR}/backup.log"
