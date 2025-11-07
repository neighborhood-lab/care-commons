#!/bin/bash
set -e

# Backup user-uploaded files (if stored locally)
UPLOADS_DIR="/var/care-commons/uploads"
BACKUP_DIR="/var/backups/care-commons/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -d $UPLOADS_DIR ]; then
  mkdir -p $BACKUP_DIR
  tar -czf $BACKUP_DIR/files_${TIMESTAMP}.tar.gz $UPLOADS_DIR
  echo "✅ Files backed up"

  # Upload to S3
  if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp $BACKUP_DIR/files_${TIMESTAMP}.tar.gz s3://$AWS_S3_BUCKET/backups/files/
    echo "✅ Files backup uploaded to S3"
  fi
else
  echo "ℹ️  Uploads directory not found at $UPLOADS_DIR (may be using cloud storage)"
fi
