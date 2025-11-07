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

## Backup Automation

### Database Backups

The `backup-database.sh` script performs automated database backups:

```bash
# Run manually
./scripts/backup-database.sh

# Schedule via cron (daily at 2 AM)
0 2 * * * /path/to/care-commons/scripts/backup-database.sh >> /var/log/care-commons-backup.log 2>&1
```

Features:
- Compressed backups with timestamps
- Optional S3 upload
- Automatic cleanup of old backups (30-day retention)
- Integrity verification

### File Storage Backups

The `backup-files.sh` script backs up user-uploaded files:

```bash
# Run manually
./scripts/backup-files.sh

# Schedule via cron (daily at 3 AM)
0 3 * * * /path/to/care-commons/scripts/backup-files.sh >> /var/log/care-commons-files-backup.log 2>&1
```

### Configuration Backups

The `backup-config.sh` script backs up critical configuration files:

```bash
# Run manually
./scripts/backup-config.sh

# Schedule via cron (weekly)
0 4 * * 0 /path/to/care-commons/scripts/backup-config.sh >> /var/log/care-commons-config-backup.log 2>&1
```

## Backup Verification

### Automated Verification

The `verify-backups.sh` script checks that recent backups exist and are valid:

```bash
# Run manually
./scripts/verify-backups.sh

# Schedule via cron (every 6 hours)
0 */6 * * * /path/to/care-commons/scripts/verify-backups.sh >> /var/log/care-commons-backup-verify.log 2>&1
```

### Monthly Restoration Tests

The `test-backup-restore.sh` script performs a full restoration test:

```bash
# Run manually
./scripts/test-backup-restore.sh

# Schedule via cron (first day of month at 5 AM)
0 5 1 * * /path/to/care-commons/scripts/test-backup-restore.sh >> /var/log/care-commons-backup-test.log 2>&1
```

## Data Retention

### HIPAA Compliance

Healthcare records must be retained for 6 years minimum. Our policy:
- Active records: Indefinite retention
- Archived visits: 7 years before soft-delete
- Soft-deleted records: 1 additional year before hard-delete
- Audit logs: 7 years (archived but retained)

### Running Data Retention

```bash
# Run manually (caution: destructive)
psql -h $DB_HOST -U $DB_USER -d care_commons -f scripts/data-retention.sql

# Schedule via cron (first day of every month at 3 AM)
0 3 1 * * psql -h $DB_HOST -U $DB_USER -d care_commons -f /path/to/scripts/data-retention.sql >> /var/log/care-commons-retention.log 2>&1
```

## Database Restoration

### Using the Restore Script

```bash
# Restore from a backup file
./scripts/restore-database.sh /var/backups/care-commons/backup_care_commons_20240101_020000.sql.gz
```

The script will:
1. Prompt for confirmation
2. Decompress the backup if needed
3. Terminate existing database connections
4. Drop and recreate the database
5. Restore from the backup
6. Verify the restoration

### Manual Restoration

If the script is unavailable:

```bash
# Decompress backup
gunzip backup_care_commons_20240101_020000.sql.gz

# Restore
psql -h localhost -U postgres -d care_commons -f backup_care_commons_20240101_020000.sql
```

## Neon PostgreSQL

For production deployments using Neon:

### Automatic Backups

Neon provides automatic backups with point-in-time recovery:
1. Go to Neon Console → Your Project → Settings
2. Enable "Continuous Backup"
3. Set retention period: 30 days (recommended)
4. Configure backup schedule: Every 6 hours

### Point-in-Time Recovery

To restore to a specific point in time:
1. Go to Neon Console → Your Project → Backups
2. Select "Point-in-Time Recovery"
3. Choose the desired timestamp
4. Create a new branch or restore to existing

### Branch Recovery

Create a recovery branch for testing:
```bash
# Using Neon CLI
neonctl branches create --name recovery-test --parent main --timestamp "2024-01-01T02:00:00Z"
```

## Monitoring and Alerts

### Backup Health Monitoring

Set up alerts for:
- Missing backups (>25 hours old)
- Failed backup integrity checks
- Backup size anomalies
- S3 upload failures

### Slack Integration

Configure `SLACK_WEBHOOK_URL` environment variable for alerts:
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## Recovery Time Objective (RTO)

Target: < 1 hour

Typical recovery times:
- Database restore: 15-30 minutes
- Application deployment: 10-15 minutes
- DNS propagation: 5-10 minutes
- Verification: 5-10 minutes

## Recovery Point Objective (RPO)

Target: 0 (zero data loss)

Achieved through:
- Continuous backup with Neon (or WAL archiving)
- Daily automated backups
- S3 versioning for backup files
- Transaction log retention

## Security Considerations

### Backup Encryption

Backups should be encrypted:
- At rest: S3 bucket encryption (AES-256)
- In transit: TLS/SSL for all transfers
- Database: Encrypted connections only

### Access Control

Limit backup access to:
- Database administrators
- DevOps engineers (on-call)
- Automated backup systems

### Credential Management

- Store database credentials in secure vault (e.g., AWS Secrets Manager)
- Rotate credentials quarterly
- Use IAM roles for S3 access (no hardcoded keys)

## Testing Requirements

### Quarterly Disaster Recovery Drills

1. Full infrastructure failure simulation
2. Complete restoration from backups
3. Application functionality verification
4. Documentation of actual vs. target RTO/RPO

### Monthly Backup Tests

1. Automated restoration to test database
2. Data integrity verification
3. Performance benchmarking

## Support Contacts

- **On-Call Engineer**: [Configure in ops/contacts.md]
- **Database Administrator**: [Configure in ops/contacts.md]
- **Security Team**: [Configure in ops/contacts.md]
- **Neon Support**: https://neon.tech/docs/introduction/support
