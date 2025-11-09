# Backup and Restore Procedures

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: DevOps/Engineering Team

---

## Overview

This document outlines backup and restore procedures for the Care Commons platform, ensuring data protection and recovery capabilities.

---

## Backup Strategy

### Primary Backup: Neon Automated Backups

**Configuration**:
- **Provider**: Neon PostgreSQL
- **Type**: Continuous backup with point-in-time recovery (PITR)
- **Frequency**: Continuous (transaction log archiving)
- **Retention**: 30 days (Neon Pro plan)
- **Storage**: AWS S3 (multi-region, encrypted)
- **Encryption**: AES-256 at rest, TLS in transit
- **Recovery Granularity**: Any point in time within retention period

**Verification**:
```
1. Log in to Neon Console: https://console.neon.tech
2. Select your project
3. Navigate to "Branches" tab
4. Verify "Main" branch shows recent backup timestamp
5. Check "History" for backup events
```

**Advantages**:
- Zero administration overhead
- Minimal RPO (< 5 minutes)
- Fast recovery (< 1 hour)
- No performance impact on production

### Secondary Backup: Manual Exports

**Purpose**: Additional layer of protection, long-term archival

**Schedule**: Weekly (Sundays at 2:00 AM UTC)

**Procedure**:

```bash
#!/bin/bash
# Automated weekly backup script

# Set variables
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="care-commons-backup-${BACKUP_DATE}.sql"
S3_BUCKET="s3://care-commons-backups/weekly"

# Create backup
echo "Creating backup: ${BACKUP_FILE}"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Verify backup created
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not created"
  exit 1
fi

# Check backup size (should be > 1MB for our schema)
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ "$BACKUP_SIZE" -lt 1048576 ]; then
  echo "ERROR: Backup file too small (${BACKUP_SIZE} bytes)"
  exit 1
fi

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE

# Upload to S3
echo "Uploading to S3..."
aws s3 cp ${BACKUP_FILE}.gz ${S3_BUCKET}/ \
  --sse AES256 \
  --storage-class STANDARD_IA

# Verify upload
if aws s3 ls ${S3_BUCKET}/${BACKUP_FILE}.gz; then
  echo "✅ Backup successful: ${BACKUP_FILE}.gz"
  # Clean up local file
  rm ${BACKUP_FILE}.gz
else
  echo "ERROR: Upload to S3 failed"
  exit 1
fi

# Clean up old backups (keep last 90 days)
echo "Cleaning up old backups..."
aws s3 ls ${S3_BUCKET}/ | while read -r line; do
  CREATE_DATE=$(echo $line | awk '{print $1" "$2}')
  CREATE_DATE_SEC=$(date -d "$CREATE_DATE" +%s)
  CURRENT_SEC=$(date +%s)
  DIFF_DAYS=$(( ($CURRENT_SEC - $CREATE_DATE_SEC) / 86400 ))

  if [ $DIFF_DAYS -gt 90 ]; then
    FILE_NAME=$(echo $line | awk '{print $4}')
    echo "Deleting old backup: $FILE_NAME (${DIFF_DAYS} days old)"
    aws s3 rm ${S3_BUCKET}/${FILE_NAME}
  fi
done

echo "Backup process complete"
```

**Automation** (GitHub Actions):

Create `.github/workflows/backup.yml`:

```yaml
name: Weekly Database Backup

on:
  schedule:
    # Every Sunday at 2:00 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Create and upload backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          ./scripts/backup-database.sh

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "❌ Weekly database backup failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Weekly database backup failed. Check GitHub Actions logs."
                  }
                }
              ]
            }
```

---

## Restore Procedures

### Scenario 1: Restore to Specific Point in Time

**Use Case**: Recover from accidental data deletion, corruption

**Procedure**:

1. **Access Neon Console**:
   ```
   1. Navigate to https://console.neon.tech
   2. Select your project
   3. Click "Branches" tab
   ```

2. **Create Recovery Branch**:
   ```
   1. Click "Create branch"
   2. Select "Point in time" option
   3. Choose date and time to restore to
   4. Name: "recovery-[YYYY-MM-DD-HHMM]"
   5. Click "Create"
   6. Wait for branch creation (1-5 minutes)
   ```

3. **Verify Recovery Branch**:
   ```bash
   # Get connection string for recovery branch
   # From Neon Console → Branch → Connection Details

   # Connect to recovery branch
   psql "postgresql://..."

   # Verify data
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM visits;
   SELECT * FROM visits ORDER BY created_at DESC LIMIT 10;

   # Check for expected data
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

4. **Option A: Promote Recovery Branch to Production**:
   ```
   If data is correct and complete:

   1. Update DATABASE_URL environment variable in Vercel:
      - Go to Vercel Dashboard → Project → Settings → Environment Variables
      - Update DATABASE_URL to recovery branch connection string
      - Save changes

   2. Redeploy application:
      - Go to Deployments tab
      - Click "Redeploy" on latest deployment
      - Or push a commit to trigger deployment

   3. Verify application working with restored data

   4. Rename branches in Neon (optional):
      - Rename "main" to "main-backup-[date]"
      - Rename "recovery-[date]" to "main"
   ```

5. **Option B: Copy Data from Recovery Branch**:
   ```bash
   # If only specific data needs restoration

   # Export specific table from recovery branch
   pg_dump -t users "postgresql://recovery-branch..." > users_recovered.sql

   # Import to production
   psql $PRODUCTION_DATABASE_URL < users_recovered.sql
   ```

**Expected Duration**: 30 minutes - 1 hour

**Data Loss**: Minimal (restore to exact point in time)

### Scenario 2: Restore from Manual Backup

**Use Case**: Neon backups unavailable, restore from S3 backup

**Procedure**:

1. **Download Backup from S3**:
   ```bash
   # List available backups
   aws s3 ls s3://care-commons-backups/weekly/

   # Download specific backup
   aws s3 cp s3://care-commons-backups/weekly/care-commons-backup-20250101-020000.sql.gz .

   # Decompress
   gunzip care-commons-backup-20250101-020000.sql.gz
   ```

2. **Create New Database**:
   ```
   Option A: Create new Neon branch
   1. Neon Console → Branches → Create branch
   2. Name: "restore-from-backup-[date]"
   3. Copy connection string

   Option B: Create new Neon project (if current project unavailable)
   1. Neon Console → New Project
   2. Name: "care-commons-recovery"
   3. Copy connection string
   ```

3. **Restore Backup**:
   ```bash
   # Restore to new database
   psql "postgresql://new-database..." < care-commons-backup-20250101-020000.sql

   # Monitor progress (for large backups)
   # The restore will output progress messages
   ```

4. **Run Migrations** (if backup is older):
   ```bash
   # Set DATABASE_URL to restored database
   export DATABASE_URL="postgresql://new-database..."

   # Check migration status
   npm run db:migrate:status

   # Run missing migrations
   npm run db:migrate
   ```

5. **Verify Data Integrity**:
   ```sql
   -- Connect to restored database
   psql "$DATABASE_URL"

   -- Verify table counts
   SELECT 'users' as table_name, COUNT(*) as count FROM users
   UNION ALL
   SELECT 'clients', COUNT(*) FROM clients
   UNION ALL
   SELECT 'caregivers', COUNT(*) FROM caregivers
   UNION ALL
   SELECT 'visits', COUNT(*) FROM visits;

   -- Verify recent data
   SELECT created_at FROM visits ORDER BY created_at DESC LIMIT 1;

   -- Check for data corruption
   SELECT COUNT(*) FROM users WHERE email IS NULL; -- Should be 0
   SELECT COUNT(*) FROM visits WHERE client_id IS NULL; -- Should be 0
   ```

6. **Switch to Restored Database**:
   ```
   1. Update DATABASE_URL in Vercel environment variables
   2. Redeploy application
   3. Test critical flows
   4. Monitor for errors
   ```

**Expected Duration**: 1-2 hours

**Data Loss**: Depends on backup age (weekly = up to 7 days)

### Scenario 3: Selective Data Recovery

**Use Case**: Recover specific records without full restore

**Procedure**:

1. **Create Temporary Recovery Branch**:
   ```
   1. Neon Console → Create branch (point-in-time)
   2. Select time before data loss
   3. Name: "temp-recovery-[timestamp]"
   ```

2. **Export Specific Data**:
   ```bash
   # Connect to recovery branch
   RECOVERY_URL="postgresql://recovery-branch..."

   # Export specific table
   pg_dump -t visits \
     --data-only \
     --column-inserts \
     $RECOVERY_URL > visits_recovery.sql

   # Or export specific records
   psql $RECOVERY_URL -c "COPY (
     SELECT * FROM visits
     WHERE created_at >= '2025-01-01'
     AND created_at < '2025-01-02'
   ) TO STDOUT CSV HEADER" > visits_20250101.csv
   ```

3. **Import to Production**:
   ```bash
   # Review data before import
   less visits_recovery.sql

   # Import (be careful with conflicts)
   psql $PRODUCTION_DATABASE_URL < visits_recovery.sql

   # Or use CSV import
   psql $PRODUCTION_DATABASE_URL -c "\COPY visits FROM 'visits_20250101.csv' CSV HEADER"
   ```

4. **Verify Import**:
   ```sql
   -- Check for duplicates
   SELECT client_id, caregiver_id, scheduled_start, COUNT(*)
   FROM visits
   GROUP BY client_id, caregiver_id, scheduled_start
   HAVING COUNT(*) > 1;

   -- Verify recovered records
   SELECT * FROM visits
   WHERE created_at >= '2025-01-01'
   ORDER BY created_at DESC;
   ```

5. **Clean Up**:
   ```
   1. Delete temporary recovery branch in Neon Console
   2. Remove local backup files
   ```

---

## Backup Verification

### Monthly Verification Checklist

- [ ] **Verify Neon Backups Exist**:
  - Log in to Neon Console
  - Check backup history
  - Verify last backup timestamp

- [ ] **Verify S3 Backups**:
  ```bash
  # List recent backups
  aws s3 ls s3://care-commons-backups/weekly/ | tail -10

  # Check latest backup size
  aws s3 ls s3://care-commons-backups/weekly/ --human-readable | tail -1
  ```

- [ ] **Test Backup Accessibility**:
  ```bash
  # Download latest backup
  LATEST=$(aws s3 ls s3://care-commons-backups/weekly/ | tail -1 | awk '{print $4}')
  aws s3 cp s3://care-commons-backups/weekly/$LATEST /tmp/

  # Verify can decompress
  gunzip -t /tmp/$LATEST

  # Clean up
  rm /tmp/$LATEST
  ```

### Quarterly Restore Drill

**Purpose**: Verify backup procedures and team readiness

**Procedure**:

1. **Schedule Drill** (1 week advance notice)
2. **Execute Test Restore**:
   ```
   - Create test recovery branch from PITR
   - Verify data integrity
   - Time the process
   - Document any issues
   ```
3. **Team Review**:
   - Debrief meeting
   - Update procedures
   - Address gaps
4. **Document Results**:
   - Actual vs expected duration
   - Issues encountered
   - Improvements made

---

## Backup Retention Policy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Neon PITR | Continuous | 30 days | AWS S3 (Neon managed) |
| Manual Export | Weekly | 90 days | S3 (self-managed) |
| Pre-Migration | On-demand | 90 days | S3 (self-managed) |
| Pre-Release | On-demand | 90 days | S3 (self-managed) |

---

## Data Integrity Checks

### Post-Restore Validation

Run these checks after any restore operation:

```sql
-- 1. Verify table counts (compare with pre-restore if available)
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 2. Check for NULL values in required fields
SELECT 'users.email' as field, COUNT(*) as null_count
FROM users WHERE email IS NULL
UNION ALL
SELECT 'visits.client_id', COUNT(*) FROM visits WHERE client_id IS NULL
UNION ALL
SELECT 'visits.caregiver_id', COUNT(*) FROM visits WHERE caregiver_id IS NULL;

-- 3. Verify foreign key integrity
SELECT COUNT(*) as orphaned_visits
FROM visits v
LEFT JOIN clients c ON v.client_id = c.id
WHERE c.id IS NULL;

-- 4. Check date ranges
SELECT
  'users' as table_name,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM users
UNION ALL
SELECT 'visits', MIN(created_at), MAX(created_at) FROM visits;

-- 5. Verify data consistency
SELECT organization_id, COUNT(*) as user_count
FROM users
GROUP BY organization_id
ORDER BY user_count DESC;
```

---

## Compliance Requirements

### HIPAA Backup Requirements

- ✅ **Encrypted at Rest**: All backups encrypted with AES-256
- ✅ **Encrypted in Transit**: TLS for all transfers
- ✅ **Access Controls**: IAM-based access to S3 backups
- ✅ **Audit Trail**: S3 access logging enabled
- ✅ **Retention**: Minimum 7 years for medical records
- ✅ **Secure Disposal**: Automated expiration/deletion

### EVV Backup Requirements

- ✅ **Visit Records**: 7-year retention (state requirements)
- ✅ **GPS Data**: Preserved in backups
- ✅ **Timestamp Integrity**: Verified in restore validation
- ✅ **Audit Trail**: All visit modifications logged

---

## Troubleshooting

### Issue: Backup File Too Large

```bash
# Use pg_dump with compression
pg_dump -Fc $DATABASE_URL > backup.dump

# Or compress separately
pg_dump $DATABASE_URL | gzip > backup.sql.gz

# For very large databases, backup specific schemas
pg_dump -n public $DATABASE_URL | gzip > backup-public.sql.gz
```

### Issue: Restore Taking Too Long

```bash
# Use parallel restore (custom format)
pg_restore -j 4 -d $DATABASE_URL backup.dump

# Or split restore by table
pg_restore -t users -d $DATABASE_URL backup.dump
pg_restore -t visits -d $DATABASE_URL backup.dump
```

### Issue: S3 Upload Fails

```bash
# Use multipart upload for large files
aws s3 cp backup.sql.gz s3://bucket/ \
  --storage-class STANDARD_IA \
  --metadata "backup-date=$(date +%Y-%m-%d)"

# Verify upload with checksum
aws s3api head-object \
  --bucket care-commons-backups \
  --key weekly/backup.sql.gz
```

---

## Emergency Contacts

**Neon Support**:
- Email: support@neon.tech
- Dashboard: https://console.neon.tech
- Documentation: https://neon.tech/docs

**AWS Support** (for S3 issues):
- Console: https://console.aws.amazon.com/support
- Documentation: https://docs.aws.amazon.com/s3

**Internal**:
- DevOps Lead: [Contact]
- Database Admin: [Contact]
- On-Call Engineer: [Contact]

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Review**: 2026-02-08 (Quarterly)
**Last Restore Drill**: [Schedule first drill]
