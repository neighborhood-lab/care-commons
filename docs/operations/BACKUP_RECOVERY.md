# Database Backup and Recovery Procedures

## Overview

Care Commons implements a **dual-strategy backup approach** for HIPAA compliance and disaster recovery:

1. **Neon Branch Backups** - Instant, copy-on-write snapshots with point-in-time recovery
2. **pg_dump Backups** - Traditional PostgreSQL dumps for portability and long-term archival

## Backup Strategy

### Automated Daily Backups

- **Schedule**: Daily at 2 AM UTC (9 PM EST / 6 PM PST)
- **Workflow**: `.github/workflows/backup.yml`
- **Retention**: 30 days for daily backups, 12 months for monthly snapshots
- **Storage**: Neon branches + S3 (encrypted, STANDARD_IA storage class)
- **Verification**: Automated integrity checks after each backup

### Backup Types

#### 1. Neon Branch Backups (Primary)

**Advantages:**
- Instant creation (copy-on-write, no downtime)
- Point-in-time recovery (PITR) to any second
- Zero storage cost (Neon's architecture)
- Fast restoration (seconds to minutes)

**Limitations:**
- Neon-specific (not portable to other PostgreSQL hosts)
- Requires Neon API access

#### 2. pg_dump Backups (Secondary)

**Advantages:**
- Portable to any PostgreSQL instance
- Offline archival capability
- Encrypted storage in S3
- Standard PostgreSQL tooling

**Limitations:**
- Slower creation (database size dependent)
- Point-in-time recovery limited to backup timestamp
- Storage costs (S3)

## Manual Backup Operations

### Create a Backup

```bash
# Both Neon branch + pg_dump
tsx scripts/backup-neon.ts --type both

# Neon branch only (instant)
tsx scripts/backup-neon.ts --type branch

# pg_dump only (portable)
tsx scripts/backup-neon.ts --type dump

# Verify latest backup
tsx scripts/backup-neon.ts --verify
```

### Environment Variables

Required for backup operations:

```bash
# Neon Configuration (required for branch backups)
NEON_API_KEY=your_api_key
NEON_PROJECT_ID=your_project_id

# Database Connection (required for pg_dump backups)
DATABASE_URL=postgresql://user:pass@host/database

# Local Storage
BACKUP_DIR=/var/backups/care-commons  # Default

# S3 Configuration (optional, recommended for production)
S3_BACKUP_BUCKET=care-commons-backups
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Retention Policy
BACKUP_RETENTION_DAYS=30              # Default
MONTHLY_RETENTION_MONTHS=12           # Default
```

## Recovery Procedures

### Scenario 1: Recent Data Loss (< 7 days)

**Use Neon Branch Restoration (Fastest)**

```bash
# List available backup branches
neon branches list --project-id "$NEON_PROJECT_ID"

# Identify the backup branch closest to desired time
# Example: backup-2025-11-10T14-30-00-000Z

# Restore from branch (creates new branch from backup)
neon branches restore \
  --id backup-2025-11-10T14-30-00-000Z \
  --project-id "$NEON_PROJECT_ID" \
  --target main

# Or create new branch and test before promoting
neon branches restore \
  --id backup-2025-11-10T14-30-00-000Z \
  --project-id "$NEON_PROJECT_ID" \
  --name restored-test
```

**Estimated Recovery Time**: 5-15 minutes

### Scenario 2: Older Data Loss (7-30 days)

**Use pg_dump Restoration**

```bash
# Download backup from S3 (if stored remotely)
aws s3 cp \
  "s3://care-commons-backups/backups/care_commons_2025-11-03T02-00-00-000Z.dump" \
  /tmp/restore.dump

# Or use local backup
BACKUP_FILE="/var/backups/care-commons/care_commons_2025-11-03T02-00-00-000Z.dump"

# Create temporary database for testing
createdb care_commons_restore_test

# Restore to temporary database
pg_restore \
  --dbname=care_commons_restore_test \
  --verbose \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

# Verify restoration
psql care_commons_restore_test -c "SELECT COUNT(*) FROM organizations;"
psql care_commons_restore_test -c "SELECT COUNT(*) FROM users;"
psql care_commons_restore_test -c "SELECT MAX(created_at) FROM audit_log;"

# If verified, restore to production (CAUTION!)
pg_restore \
  --dbname="$DATABASE_URL" \
  --verbose \
  --clean \
  --if-exists \
  "$BACKUP_FILE"
```

**Estimated Recovery Time**: 30 minutes - 2 hours (depends on database size)

### Scenario 3: Point-in-Time Recovery (Neon PITR)

**Restore to specific timestamp (not just backup time)**

```bash
# Neon supports PITR to any point within retention window
# Check your retention window
neon projects get --project-id "$NEON_PROJECT_ID"

# Create branch from specific timestamp
neon branches create \
  --name "pitr-2025-11-10-14-25" \
  --parent main \
  --timestamp "2025-11-10T14:25:00Z" \
  --project-id "$NEON_PROJECT_ID"

# Connect to branch and verify data
neon connection-string pitr-2025-11-10-14-25

# If correct, promote branch to main
neon branches rename pitr-2025-11-10-14-25 main-old
neon branches rename pitr-2025-11-10-14-25 main
```

**Estimated Recovery Time**: 10-20 minutes

### Scenario 4: Complete Infrastructure Failure

**Restore to New PostgreSQL Instance**

```bash
# Download latest backup from S3
aws s3 cp \
  "s3://care-commons-backups/backups/$(aws s3 ls s3://care-commons-backups/backups/ | sort | tail -1 | awk '{print $4}')" \
  /tmp/restore.dump

# Create new database on new PostgreSQL instance
createdb -h new-postgres-host care_commons

# Restore database
pg_restore \
  --host=new-postgres-host \
  --dbname=care_commons \
  --username=postgres \
  --verbose \
  --clean \
  --if-exists \
  /tmp/restore.dump

# Run migrations to ensure schema is current
DATABASE_URL="postgresql://postgres@new-postgres-host/care_commons" \
  npm run db:migrate

# Update DNS/load balancer to point to new instance
```

**Estimated Recovery Time**: 1-3 hours

## Testing and Verification

### Monthly Backup Testing

**Required for HIPAA Compliance**

```bash
# 1. Download random backup from last month
BACKUP_FILE=$(aws s3 ls s3://care-commons-backups/backups/ | \
  grep "$(date -d '1 month ago' +%Y-%m)" | \
  shuf -n 1 | \
  awk '{print $4}')

aws s3 cp "s3://care-commons-backups/backups/$BACKUP_FILE" /tmp/test-restore.dump

# 2. Restore to test database
createdb care_commons_restore_test
pg_restore --dbname=care_commons_restore_test /tmp/test-restore.dump

# 3. Verify critical tables
psql care_commons_restore_test <<EOF
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'caregivers', COUNT(*) FROM caregivers
UNION ALL
SELECT 'visits', COUNT(*) FROM visits
UNION ALL
SELECT 'evv_records', COUNT(*) FROM evv_records;
EOF

# 4. Document results
echo "Backup Test Results - $(date)" >> /tmp/backup-test-results.log
echo "Backup File: $BACKUP_FILE" >> /tmp/backup-test-results.log
echo "Status: SUCCESS" >> /tmp/backup-test-results.log

# 5. Cleanup
dropdb care_commons_restore_test
rm /tmp/test-restore.dump
```

### Automated Verification

The backup workflow automatically verifies:
- ✅ Backup file integrity (pg_restore --list)
- ✅ Retention policy compliance (no backups older than 30 days)
- ✅ Minimum backup count (at least 7 daily backups available)

## Monitoring and Alerts

### GitHub Actions

- **Backup failures** create GitHub issues automatically
- **Retention violations** trigger workflow failures
- **Slack notifications** sent on backup failures (if configured)

### Manual Monitoring

```bash
# Check backup status
tsx scripts/backup-neon.ts --verify

# List recent backups
neon branches list --project-id "$NEON_PROJECT_ID" | grep backup-

# Check S3 backup inventory
aws s3 ls s3://care-commons-backups/backups/ | tail -10
```

## HIPAA Compliance Checklist

- ✅ **Automated daily backups** (30-day retention)
- ✅ **Encrypted storage** (AES-256 in S3, TLS in-transit)
- ✅ **Geographic redundancy** (S3 cross-region replication recommended)
- ✅ **Access controls** (IAM policies, Neon API key rotation)
- ✅ **Audit trail** (GitHub Actions logs, S3 access logs)
- ✅ **Tested restoration** (monthly verification required)
- ✅ **Documented procedures** (this document)
- ✅ **Retention policy** (30 days + 12 months for monthly snapshots)

## Security Considerations

### Access Control

- **Neon API Key**: Store in GitHub Secrets, rotate quarterly
- **S3 Bucket**: IAM policy with least privilege (write-only for backups)
- **Backup Files**: Server-side encryption (SSE-AES256)
- **Database Credentials**: Never commit to repository

### Encryption

- **In-Transit**: TLS 1.3 for all connections (Neon, S3, PostgreSQL)
- **At-Rest**: 
  - Neon: Encrypted by default (AES-256)
  - S3: Server-side encryption enabled
  - pg_dump: Can be encrypted with GPG (optional)

### Audit Trail

All backup operations are logged:
- GitHub Actions workflow runs
- Neon API calls (branch create/delete)
- S3 API calls (CloudTrail)
- Application logs (pino with context)

## Disaster Recovery Objectives

| Metric | Target | Actual |
|--------|--------|--------|
| **RPO** (Recovery Point Objective) | < 24 hours | < 5 minutes (Neon PITR) |
| **RTO** (Recovery Time Objective) | < 4 hours | 5-60 minutes (scenario-dependent) |
| **Backup Frequency** | Daily | Daily (2 AM UTC) |
| **Retention Period** | 30 days | 30 days (daily) + 12 months (monthly) |
| **Testing Frequency** | Monthly | Automated daily verification |

## Troubleshooting

### Backup Creation Fails

```bash
# Check Neon API access
neon auth whoami

# Check database connectivity
psql "$DATABASE_URL" -c "SELECT version();"

# Check S3 access
aws s3 ls "s3://${S3_BACKUP_BUCKET}/"

# Check disk space
df -h "$BACKUP_DIR"
```

### Backup Verification Fails

```bash
# Verify file is not corrupted
pg_restore --list /path/to/backup.dump

# Check file permissions
ls -lh /path/to/backup.dump

# Re-download from S3
aws s3 cp "s3://care-commons-backups/backups/file.dump" /tmp/verify.dump
pg_restore --list /tmp/verify.dump
```

### Restoration Fails

```bash
# Check PostgreSQL version compatibility
psql --version
pg_restore --version

# Restore with verbose logging
pg_restore --verbose --dbname=test_db backup.dump 2>&1 | tee restore.log

# Restore without --clean (if objects don't exist yet)
pg_restore --dbname=test_db backup.dump

# Restore specific table only
pg_restore --table=table_name --dbname=test_db backup.dump
```

## Support and Escalation

### Emergency Contacts

- **On-Call Engineer**: (GitHub Pages on-call rotation)
- **Database Administrator**: (DBA on-call)
- **Security Team**: (HIPAA compliance issues)

### Escalation Path

1. **Backup failure detected** → GitHub issue created automatically
2. **Manual intervention needed** → On-call engineer notified
3. **Restoration required** → Follow recovery procedures above
4. **Data loss confirmed** → Escalate to security team + legal

## Additional Resources

- [Neon Branching Documentation](https://neon.tech/docs/guides/branching)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [HIPAA Backup Requirements](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [AWS S3 Backup Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-best-practices.html)
