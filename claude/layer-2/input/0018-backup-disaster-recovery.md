# Task 0018: Implement Backup and Disaster Recovery

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 6-8 hours

## Context

Production systems require robust backup and disaster recovery procedures to prevent data loss and ensure business continuity. Implement automated backups, disaster recovery playbooks, and data retention policies.

## Goal

- Zero data loss tolerance (RPO = 0)
- <1 hour recovery time (RTO < 1 hour)
- Automated daily backups
- Tested recovery procedures
- HIPAA-compliant data retention

## Task

### 1. Set Up Automated Database Backups

**For Neon PostgreSQL (recommended for production)**:

Neon provides automatic backups with point-in-time recovery. Configure in project settings:
- Enable continuous backup
- Set retention period (30 days recommended)
- Configure backup schedule (every 6 hours)

**For self-hosted PostgreSQL**:

**File**: `scripts/backup-database.sh`

```bash
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
```

**Make executable**:
```bash
chmod +x scripts/backup-database.sh
```

**Add to cron**:
```bash
# Backup every day at 2 AM
0 2 * * * /path/to/care-commons/scripts/backup-database.sh >> /var/log/care-commons-backup.log 2>&1
```

### 2. Set Up File Storage Backups

**File**: `scripts/backup-files.sh`

```bash
#!/bin/bash
set -e

# Backup user-uploaded files (if stored locally)
UPLOADS_DIR="/var/care-commons/uploads"
BACKUP_DIR="/var/backups/care-commons/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -d $UPLOADS_DIR ]; then
  tar -czf $BACKUP_DIR/files_${TIMESTAMP}.tar.gz $UPLOADS_DIR
  echo "✅ Files backed up"

  # Upload to S3
  if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp $BACKUP_DIR/files_${TIMESTAMP}.tar.gz s3://$AWS_S3_BUCKET/backups/files/
  fi
fi
```

### 3. Implement Point-in-Time Recovery

**Document PITR procedure**:

**File**: `docs/DISASTER_RECOVERY.md`

```markdown
# Disaster Recovery Procedures

## Point-in-Time Recovery (PITR)

### Prerequisites
- Access to backup storage (S3 or local backups)
- PostgreSQL client tools installed
- Credentials for target database

### Recovery Steps

1. **Identify recovery point**
   ```bash
   # List available backups
   aws s3 ls s3://care-commons-backups/backups/database/
   ```

2. **Download backup**
   ```bash
   aws s3 cp s3://care-commons-backups/backups/database/backup_20240101_020000.sql.gz .
   gunzip backup_20240101_020000.sql.gz
   ```

3. **Stop application servers**
   ```bash
   # Prevent writes during recovery
   kubectl scale deployment care-commons-api --replicas=0
   ```

4. **Restore database**
   ```bash
   # Drop existing database (CAUTION!)
   dropdb -h $DB_HOST -U $DB_USER care_commons

   # Create fresh database
   createdb -h $DB_HOST -U $DB_USER care_commons

   # Restore from backup
   pg_restore -h $DB_HOST -U $DB_USER -d care_commons backup_20240101_020000.sql

   # Or for .sql files:
   psql -h $DB_HOST -U $DB_USER -d care_commons < backup_20240101_020000.sql
   ```

5. **Verify data integrity**
   ```bash
   psql -h $DB_HOST -U $DB_USER -d care_commons -c "SELECT COUNT(*) FROM clients;"
   psql -h $DB_HOST -U $DB_USER -d care_commons -c "SELECT COUNT(*) FROM visits;"
   ```

6. **Restart application**
   ```bash
   kubectl scale deployment care-commons-api --replicas=3
   ```

7. **Verify application health**
   ```bash
   curl https://care-commons.com/health/detailed
   ```

### Expected Recovery Time
- Small database (<1GB): 5-10 minutes
- Medium database (1-10GB): 15-30 minutes
- Large database (>10GB): 30-60 minutes
```

### 4. Create Database Restore Script

**File**: `scripts/restore-database.sh`

```bash
#!/bin/bash
set -e

# Usage: ./restore-database.sh backup_file.sql.gz

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE=$1
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-care_commons}
DB_USER=${DATABASE_USER:-postgres}

# Confirmation prompt
echo "⚠️  WARNING: This will DROP and restore the database '$DB_NAME'"
echo "   Backup file: $BACKUP_FILE"
echo "   Database host: $DB_HOST"
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 1
fi

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -k $BACKUP_FILE
  BACKUP_FILE=${BACKUP_FILE%.gz}
fi

# Drop connections
echo "Terminating active connections..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "Dropping database..."
dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME || true

echo "Creating database..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

# Restore
echo "Restoring from backup..."
if [[ $BACKUP_FILE == *.sql ]]; then
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE
else
  pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME $BACKUP_FILE
fi

echo "✅ Database restored successfully"

# Verify
RECORD_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM clients;")
echo "Verification: $RECORD_COUNT clients in database"
```

### 5. Implement Configuration Backups

**File**: `scripts/backup-config.sh`

```bash
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

tar -czf $BACKUP_DIR/config_${TIMESTAMP}.tar.gz ${CONFIG_FILES[@]}

# Upload to S3
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp $BACKUP_DIR/config_${TIMESTAMP}.tar.gz s3://$AWS_S3_BUCKET/backups/config/
fi

echo "✅ Configuration backed up"
```

### 6. Set Up Monitoring for Backups

**File**: `scripts/verify-backups.sh`

```bash
#!/bin/bash
set -e

# Verify recent backup exists
BACKUP_DIR="/var/backups/care-commons"
HOURS_THRESHOLD=25 # Alert if no backup in 25 hours

LATEST_BACKUP=$(find $BACKUP_DIR -name "backup_*.sql.gz" -mtime -1 -print -quit)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No recent backup found (within $HOURS_THRESHOLD hours)"
  # Send alert
  curl -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' \
    -d '{"text":"🚨 Care Commons: No recent database backup found!"}'
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
```

**Add to cron** (run every 6 hours):
```bash
0 */6 * * * /path/to/care-commons/scripts/verify-backups.sh >> /var/log/care-commons-backup-verify.log 2>&1
```

### 7. Implement Data Retention Policy

**File**: `scripts/data-retention.sql`

```sql
-- HIPAA requires 6 years retention for healthcare records

-- Soft-delete old records (move to archive)
BEGIN;

-- Archive visits older than 7 years
UPDATE visits
SET deleted_at = NOW()
WHERE scheduled_date < NOW() - INTERVAL '7 years'
  AND deleted_at IS NULL;

-- Archive audit logs older than 7 years
-- (Keep audit logs longer for compliance)
UPDATE audit_logs
SET archived = true
WHERE timestamp < NOW() - INTERVAL '7 years'
  AND archived = false;

-- Hard delete soft-deleted records older than 1 year
DELETE FROM visits
WHERE deleted_at < NOW() - INTERVAL '1 year';

COMMIT;

-- Vacuum to reclaim space
VACUUM ANALYZE visits;
VACUUM ANALYZE audit_logs;
```

**Run monthly via cron**:
```bash
# First day of every month at 3 AM
0 3 1 * * psql -h $DB_HOST -U $DB_USER -d care_commons -f /path/to/scripts/data-retention.sql
```

### 8. Create Disaster Recovery Runbook

**File**: `docs/RUNBOOK_DISASTER_RECOVERY.md`

```markdown
# Disaster Recovery Runbook

## Scenarios

### Scenario 1: Database Corruption

**Detection**: Application errors, data inconsistencies

**Response**:
1. Stop application (prevent further corruption)
2. Identify last known good backup
3. Restore from backup using `restore-database.sh`
4. Verify data integrity
5. Restart application
6. Monitor for issues

**Time**: 15-30 minutes

### Scenario 2: Complete Data Center Failure

**Detection**: All services down, unable to connect

**Response**:
1. Provision new infrastructure (Vercel/AWS)
2. Deploy application code from Git
3. Restore database from S3 backup
4. Update DNS to point to new infrastructure
5. Verify functionality
6. Communicate with users

**Time**: 1-2 hours

### Scenario 3: Accidental Data Deletion

**Detection**: User reports missing data

**Response**:
1. Identify affected records and time of deletion
2. Restore to temporary database from nearest backup
3. Export affected records
4. Import into production database
5. Verify with user
6. Update audit log

**Time**: 30-60 minutes

### Scenario 4: Ransomware Attack

**Detection**: Encrypted files, ransom demand

**Response**:
1. **DO NOT** pay ransom
2. Isolate affected systems immediately
3. Assess extent of encryption
4. Restore from offsite backups (pre-infection)
5. Scan for malware before restoring
6. Change all credentials
7. Report to authorities
8. Notify affected users (HIPAA breach notification)

**Time**: 4-8 hours

## Contact Information

- **On-Call Engineer**: [PHONE]
- **Database Administrator**: [PHONE]
- **Security Team**: [PHONE]
- **Legal/Compliance**: [PHONE]
```

### 9. Add Backup Testing Automation

**File**: `scripts/test-backup-restore.sh`

```bash
#!/bin/bash
set -e

# Automated backup restoration test
# Run monthly to verify backups are restorable

echo "🧪 Testing backup restoration..."

# Create test database
TEST_DB="care_commons_backup_test_$(date +%s)"
createdb -h $DB_HOST -U $DB_USER $TEST_DB

# Get latest backup
LATEST_BACKUP=$(find /var/backups/care-commons -name "backup_*.sql.gz" -mtime -1 -print -quit)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No recent backup found"
  exit 1
fi

# Decompress and restore to test database
gunzip -c $LATEST_BACKUP | psql -h $DB_HOST -U $DB_USER -d $TEST_DB

# Verify data
CLIENT_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM clients;")
VISIT_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM visits;")

echo "✅ Backup restored successfully"
echo "   Clients: $CLIENT_COUNT"
echo "   Visits: $VISIT_COUNT"

# Cleanup test database
dropdb -h $DB_HOST -U $DB_USER $TEST_DB

echo "✅ Backup restoration test passed"
```

## Acceptance Criteria

- [ ] Automated daily database backups configured
- [ ] Backups stored in offsite location (S3 or equivalent)
- [ ] Point-in-time recovery tested and documented
- [ ] Restore scripts created and tested
- [ ] Configuration backups implemented
- [ ] Backup monitoring and alerting configured
- [ ] Data retention policy implemented (HIPAA-compliant)
- [ ] Disaster recovery runbook created
- [ ] Monthly backup restoration tests automated
- [ ] Recovery procedures tested (RTO < 1 hour)
- [ ] Zero data loss in recovery tests (RPO = 0)

## Testing Checklist

- [ ] Test database restore from backup (full restore)
- [ ] Test point-in-time recovery
- [ ] Test file restore
- [ ] Test configuration restore
- [ ] Simulate complete infrastructure failure
- [ ] Verify backup integrity checks
- [ ] Test alert notifications
- [ ] Document actual recovery times

## Reference

- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup.html
- HIPAA Data Retention: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/
- AWS S3 for backups: https://aws.amazon.com/s3/
- Disaster Recovery Best Practices: https://aws.amazon.com/disaster-recovery/
