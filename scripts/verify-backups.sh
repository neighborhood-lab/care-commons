#!/bin/bash
set -e

# Verify recent backup exists
BACKUP_DIR="/var/backups/care-commons"
HOURS_THRESHOLD=25 # Alert if no backup in 25 hours

LATEST_BACKUP=$(find $BACKUP_DIR -name "backup_*.sql.gz" -mtime -1 -print -quit 2>/dev/null)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No recent backup found (within $HOURS_THRESHOLD hours)"
  # Send alert
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' \
      -d '{"text":"🚨 Folk: No recent database backup found!"}'
  fi
  exit 1
else
  echo "✅ Recent backup found: $LATEST_BACKUP"

  # Verify backup integrity
  if gunzip -t $LATEST_BACKUP 2>/dev/null; then
    echo "✅ Backup integrity verified"
  else
    echo "❌ Backup integrity check failed"
    exit 1
  fi
fi
