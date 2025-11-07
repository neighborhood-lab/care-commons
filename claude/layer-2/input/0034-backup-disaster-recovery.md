# Task 0034: Backup and Disaster Recovery Implementation

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-10 hours

## Context

Healthcare data is irreplaceable and legally protected. HIPAA requires comprehensive backup and disaster recovery procedures. Without proper backups, data loss from hardware failure, human error, or malicious attacks could be catastrophic.

## Problem Statement

Current gaps:
- No automated database backups
- No backup testing or verification
- No disaster recovery plan
- No point-in-time recovery capability
- No backup encryption
- No documented recovery procedures
- No backup retention policy

## Task

### 1. Implement Automated Database Backups

**File**: `scripts/backup-database.sh`

```bash
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
```

### 2. Implement Point-in-Time Recovery

**File**: `scripts/restore-database.sh`

```bash
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
```

### 3. Implement Backup Verification

**File**: `scripts/verify-backup.sh`

```bash
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
```

### 4. Configure Continuous Archiving (WAL)

**File**: `scripts/archive-wal.sh`

```bash
#!/bin/bash

# PostgreSQL WAL archiving script for point-in-time recovery

WAL_FILE="$1"
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-/var/lib/postgresql/wal_archive}"
S3_BUCKET="${S3_BUCKET:-}"

# Create archive directory
mkdir -p "${WAL_ARCHIVE_DIR}"

# Copy WAL file to archive
cp "${WAL_FILE}" "${WAL_ARCHIVE_DIR}/"

# Upload to S3 if configured
if [ -n "${S3_BUCKET}" ]; then
  aws s3 cp "${WAL_FILE}" "s3://${S3_BUCKET}/wal/$(basename ${WAL_FILE})"
fi

echo "[$(date)] WAL file archived: $(basename ${WAL_FILE})"
```

**PostgreSQL Configuration** (`postgresql.conf`):

```conf
# Enable WAL archiving for point-in-time recovery
wal_level = replica
archive_mode = on
archive_command = '/path/to/archive-wal.sh %p'
archive_timeout = 300  # Archive every 5 minutes
max_wal_senders = 3
wal_keep_size = 1GB
```

### 5. Create Disaster Recovery Plan

**File**: `docs/DISASTER_RECOVERY_PLAN.md`

```markdown
# Disaster Recovery Plan

## Recovery Time Objective (RTO)
- **Target**: 4 hours
- **Maximum Tolerable Downtime**: 8 hours

## Recovery Point Objective (RPO)
- **Target**: 15 minutes
- **Maximum Data Loss**: 1 hour

## Disaster Scenarios

### Scenario 1: Database Server Failure

**Recovery Steps**:
1. Provision new database server
2. Restore latest daily backup
3. Apply WAL logs for point-in-time recovery
4. Update application connection strings
5. Verify data integrity
6. Resume operations

**Estimated Recovery Time**: 2-3 hours

### Scenario 2: Complete Data Center Failure

**Recovery Steps**:
1. Activate backup data center
2. Restore database from S3
3. Apply WAL logs
4. Update DNS records
5. Verify all services operational
6. Resume operations

**Estimated Recovery Time**: 4-6 hours

### Scenario 3: Ransomware Attack

**Recovery Steps**:
1. Isolate infected systems
2. Assess data corruption extent
3. Restore from backup prior to infection
4. Patch security vulnerabilities
5. Verify system integrity
6. Resume operations

**Estimated Recovery Time**: 6-8 hours

## Backup Schedule

- **Full Backup**: Daily at 2:00 AM UTC
- **Incremental Backup**: Every 6 hours
- **WAL Archiving**: Continuous (every 5 minutes)
- **Backup Testing**: Weekly

## Contact Information

- **Primary**: ops@example.com
- **Secondary**: backup-admin@example.com
- **Emergency**: +1-555-0100

## Recovery Procedures

### 1. Database Recovery
```bash
# Download latest backup
aws s3 cp s3://bucket/backups/latest.sql.gz /tmp/

# Restore database
./scripts/restore-database.sh /tmp/latest.sql.gz

# Apply WAL logs for PITR
./scripts/apply-wal-logs.sh --until "2025-01-15 14:30:00"
```

### 2. Verify Recovery
```bash
# Check database connections
psql -h localhost -U postgres -d care_commons -c "SELECT version();"

# Verify data integrity
npm run verify:data-integrity

# Check application health
curl http://localhost:3000/health/detailed
```

### 3. Resume Operations
- Update status page
- Notify users
- Monitor for issues
- Document incident

## Testing Schedule

- **Backup Verification**: Daily (automated)
- **Restore Test**: Weekly (automated to test DB)
- **Full DR Drill**: Quarterly (manual)
- **Scenario Testing**: Annually (tabletop exercise)
```

### 6. Implement Backup Monitoring

**File**: `packages/app/src/services/backup-monitor.service.ts`

```typescript
import { logger } from '@care-commons/core/services/logger.service';
import { readFileSync } from 'fs';
import { join } from 'path';

export class BackupMonitorService {
  static async checkBackupHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    lastBackup: Date | null;
    backupAge: number; // hours
    backupSize: number; // bytes
    issues: string[];
  }> {
    const issues: string[] = [];
    const backupDir = process.env.BACKUP_DIR || '/var/backups/care-commons';

    try {
      // Read backup log
      const logPath = join(backupDir, 'backup.log');
      const logContent = readFileSync(logPath, 'utf-8');
      const logLines = logContent.trim().split('\n');
      const lastBackupLog = JSON.parse(logLines[logLines.length - 1]);

      const lastBackup = new Date(lastBackupLog.timestamp);
      const backupAge = (Date.now() - lastBackup.getTime()) / 1000 / 60 / 60; // hours

      // Check if backup is recent (< 26 hours for daily backups)
      if (backupAge > 26) {
        issues.push(`Last backup is ${backupAge.toFixed(1)} hours old (expected < 26 hours)`);
      }

      // Check if backup succeeded
      if (lastBackupLog.status !== 'success') {
        issues.push(`Last backup failed: ${lastBackupLog.status}`);
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        status = backupAge > 48 ? 'critical' : 'warning';
      }

      return {
        status,
        lastBackup,
        backupAge,
        backupSize: lastBackupLog.size || 0,
        issues,
      };
    } catch (error) {
      logger.error('Failed to check backup health', { error });
      return {
        status: 'critical',
        lastBackup: null,
        backupAge: 999,
        backupSize: 0,
        issues: ['Failed to read backup log'],
      };
    }
  }
}
```

### 7. Setup Cron Jobs

**File**: `/etc/cron.d/care-commons-backups`

```cron
# Daily full backup at 2 AM
0 2 * * * care-commons /opt/care-commons/scripts/backup-database.sh >> /var/log/care-commons/backup.log 2>&1

# Hourly incremental backup
0 * * * * care-commons /opt/care-commons/scripts/backup-database.sh --incremental >> /var/log/care-commons/backup.log 2>&1

# Weekly backup verification at 3 AM Sunday
0 3 * * 0 care-commons /opt/care-commons/scripts/verify-backup.sh /var/backups/care-commons/latest.sql.gz >> /var/log/care-commons/verify.log 2>&1

# Daily cleanup of old backups
0 4 * * * care-commons find /var/backups/care-commons -name "*.sql.gz" -mtime +30 -delete
```

## Acceptance Criteria

- [ ] Automated daily database backups configured
- [ ] Backups encrypted before storage
- [ ] Backups uploaded to S3 (off-site storage)
- [ ] Backup retention policy implemented (30 days)
- [ ] WAL archiving configured for PITR
- [ ] Restore script tested and verified
- [ ] Backup verification script automated
- [ ] Disaster recovery plan documented
- [ ] Backup monitoring implemented
- [ ] Cron jobs configured
- [ ] Alert triggers for backup failures
- [ ] DR plan tested (restore drill completed)

## Testing Checklist

1. **Backup Creation Test**: Run backup script, verify file created
2. **Backup Encryption Test**: Verify backup file is encrypted
3. **S3 Upload Test**: Verify backup uploaded to S3
4. **Restore Test**: Restore backup to test database
5. **PITR Test**: Test point-in-time recovery
6. **Verification Test**: Run automated verification script
7. **Full DR Drill**: Complete end-to-end recovery simulation

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: None

## Priority Justification

This is **CRITICAL** because:
1. Legal requirement - HIPAA mandates data backup
2. Business continuity - data loss would be catastrophic
3. Risk mitigation - protects against hardware failure, human error, ransomware
4. Compliance - required for production deployment

---

**Next Task**: 0035 - Load Testing and Performance Baselines
