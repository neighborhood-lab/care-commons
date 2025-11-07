#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/var/backups/care-commons"
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-care_commons}
DB_USER=${DATABASE_USER:-postgres}
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

# Perform backup
echo "Starting backup of $DB_NAME..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -Fc $DB_NAME | gzip > $BACKUP_FILE

# Verify backup
if [ -f $BACKUP_FILE ]; then
  SIZE=$(du -h $BACKUP_FILE | cut -f1)
  echo "✅ Backup completed: $BACKUP_FILE ($SIZE)"
else
  echo "❌ Backup failed"
  exit 1
fi

# Upload to S3 (optional but recommended)
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp $BACKUP_FILE s3://$AWS_S3_BUCKET/backups/database/
  echo "✅ Backup uploaded to S3"
fi

# Clean up old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned (retention: $RETENTION_DAYS days)"

# Test backup integrity
gunzip -t $BACKUP_FILE
echo "✅ Backup integrity verified"
