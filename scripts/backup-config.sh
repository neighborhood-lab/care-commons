#!/bin/bash
set -e

# Backup critical configuration files
CONFIG_FILES=(
  ".env"
  "vercel.json"
  ".github/workflows"
  "docs/"
  "package.json"
  "package-lock.json"
)

BACKUP_DIR="/var/backups/care-commons/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/config_${TIMESTAMP}.tar.gz ${CONFIG_FILES[@]} 2>/dev/null || true

# Upload to S3
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp $BACKUP_DIR/config_${TIMESTAMP}.tar.gz s3://$AWS_S3_BUCKET/backups/config/
  echo "✅ Configuration backed up to S3"
else
  echo "✅ Configuration backed up locally"
fi
