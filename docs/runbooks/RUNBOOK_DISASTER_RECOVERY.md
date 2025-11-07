# Disaster Recovery Runbook

## Quick Reference

**Emergency Contacts**
- On-Call Engineer: [CONFIGURE]
- Database Administrator: [CONFIGURE]
- Security Team: [CONFIGURE]
- Legal/Compliance: [CONFIGURE]

**Key Locations**
- Backup Scripts: `/home/user/care-commons/scripts/`
- Backup Storage: `/var/backups/care-commons/` or S3
- Documentation: `/home/user/care-commons/docs/DISASTER_RECOVERY.md`

---

## Scenario 1: Database Corruption

### Detection
- Application errors related to database queries
- Data inconsistencies reported by users
- Database integrity check failures
- Unusual database logs or errors

### Symptoms
```
ERROR: invalid page in block 12345 of relation "clients"
ERROR: could not read block 678 in file "base/12345/67890"
```

### Response Procedure

#### Step 1: Assess the Situation (2-5 minutes)
```bash
# Check database connectivity
psql -h $DB_HOST -U $DB_USER -d care_commons -c "SELECT 1;"

# Check for corruption
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  SELECT datname, pg_database_size(datname)
  FROM pg_database
  WHERE datname = 'care_commons';"

# Check recent errors
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  SELECT * FROM pg_stat_database_conflicts
  WHERE datname = 'care_commons';"
```

#### Step 2: Stop Application (1-2 minutes)
```bash
# Prevent further corruption
# For Vercel deployments
vercel env rm DATABASE_URL production

# For Kubernetes
kubectl scale deployment care-commons-api --replicas=0

# Notify users (post status page update)
curl -X POST $STATUS_PAGE_API -d '{"status": "maintenance"}'
```

#### Step 3: Identify Last Known Good Backup (2-3 minutes)
```bash
# List available backups
ls -lht /var/backups/care-commons/backup_*.sql.gz | head -10

# Or from S3
aws s3 ls s3://$AWS_S3_BUCKET/backups/database/ | tail -20

# Verify backup integrity
./scripts/verify-backups.sh
```

#### Step 4: Restore Database (15-30 minutes)
```bash
# Download backup if needed
aws s3 cp s3://$AWS_S3_BUCKET/backups/database/backup_20240101_020000.sql.gz .

# Run restore script
./scripts/restore-database.sh backup_20240101_020000.sql.gz
# Type 'yes' when prompted
```

#### Step 5: Verify Data Integrity (5-10 minutes)
```bash
# Check record counts
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  SELECT 'clients' as table, COUNT(*) FROM clients
  UNION ALL
  SELECT 'visits', COUNT(*) FROM visits
  UNION ALL
  SELECT 'providers', COUNT(*) FROM providers;"

# Check data consistency
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  SELECT COUNT(*) as orphaned_visits
  FROM visits v
  LEFT JOIN clients c ON v.client_id = c.id
  WHERE c.id IS NULL;"

# Run application health checks
npm run test:integration
```

#### Step 6: Restart Application (5-10 minutes)
```bash
# For Vercel
vercel env add DATABASE_URL production

# For Kubernetes
kubectl scale deployment care-commons-api --replicas=3

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=care-commons-api --timeout=300s
```

#### Step 7: Monitor and Verify (10-15 minutes)
```bash
# Check application health
curl https://care-commons.com/health/detailed

# Monitor logs
kubectl logs -f deployment/care-commons-api

# Test critical functionality
npm run test:e2e:critical

# Update status page
curl -X POST $STATUS_PAGE_API -d '{"status": "operational"}'
```

### Expected Timeline
**Total Time**: 45-75 minutes
- Assessment: 2-5 min
- Stop app: 1-2 min
- Find backup: 2-3 min
- Restore: 15-30 min
- Verify: 5-10 min
- Restart: 5-10 min
- Monitor: 10-15 min

---

## Scenario 2: Complete Data Center Failure

### Detection
- All services down across multiple availability zones
- Unable to connect to any infrastructure
- Cloud provider status page shows major outage
- Multiple monitoring alerts

### Response Procedure

#### Step 1: Confirm Scope (2-5 minutes)
```bash
# Check cloud provider status
curl https://status.aws.amazon.com/
# Or Vercel
curl https://www.vercel-status.com/

# Attempt to connect to various endpoints
ping care-commons.com
curl -I https://care-commons.com
nslookup care-commons.com
```

#### Step 2: Activate Disaster Recovery Team (5 minutes)
- Notify on-call engineer
- Notify database administrator
- Notify management
- Update status page

#### Step 3: Provision New Infrastructure (20-40 minutes)

**Option A: New Vercel Deployment**
```bash
# Clone repository
git clone https://github.com/neighborhood-lab/care-commons.git
cd care-commons

# Create new Vercel project
vercel link --yes
vercel env pull

# Deploy
vercel --prod
```

**Option B: New AWS Infrastructure**
```bash
# Use infrastructure as code
cd terraform/
terraform init
terraform apply -var="environment=disaster-recovery"

# Or use AWS CloudFormation
aws cloudformation create-stack \
  --stack-name care-commons-dr \
  --template-body file://infrastructure.yaml
```

#### Step 4: Restore Database (15-30 minutes)
```bash
# Provision new database
# For Neon
neonctl projects create --name care-commons-dr

# Download latest backup from S3
aws s3 cp s3://$AWS_S3_BUCKET/backups/database/latest.sql.gz .

# Restore
gunzip latest.sql.gz
psql -h $NEW_DB_HOST -U $DB_USER -d care_commons -f latest.sql
```

#### Step 5: Update DNS (5-10 minutes)
```bash
# Update DNS to point to new infrastructure
# Via Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://dns-update.json

# Wait for propagation
dig care-commons.com
```

#### Step 6: Verify and Test (15-30 minutes)
```bash
# Run full test suite
npm run test:all

# Manual testing checklist
# - User login
# - Create/view clients
# - Schedule visits
# - View reports
# - Mobile app connectivity
```

#### Step 7: Communicate (10 minutes)
- Update status page
- Email user notification
- Social media update (if applicable)
- Post-mortem scheduling

### Expected Timeline
**Total Time**: 70-130 minutes (1.2-2.2 hours)
- Confirm scope: 2-5 min
- Activate team: 5 min
- Provision infrastructure: 20-40 min
- Restore database: 15-30 min
- Update DNS: 5-10 min
- Verify: 15-30 min
- Communicate: 10 min

---

## Scenario 3: Accidental Data Deletion

### Detection
- User reports missing data
- Audit log shows unexpected DELETE operations
- Data count anomalies
- Missing records in reports

### Response Procedure

#### Step 1: Identify Scope (5-10 minutes)
```bash
# Query audit logs
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  SELECT * FROM audit_logs
  WHERE action IN ('DELETE', 'UPDATE')
  AND timestamp > NOW() - INTERVAL '1 hour'
  ORDER BY timestamp DESC
  LIMIT 100;"

# Identify affected records
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  SELECT table_name, record_id, deleted_at
  FROM audit_logs
  WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '1 hour';"
```

#### Step 2: Stop Further Changes (2-5 minutes)
```bash
# Revoke problematic user access
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM problem_user;"

# Or temporarily set database to read-only
psql -h $DB_HOST -U $DB_USER -d postgres -c "
  ALTER DATABASE care_commons SET default_transaction_read_only = on;"
```

#### Step 3: Create Temporary Recovery Database (10-15 minutes)
```bash
# Create recovery database
createdb -h $DB_HOST -U $DB_USER care_commons_recovery

# Find backup closest to before deletion
ls -lt /var/backups/care-commons/backup_*.sql.gz

# Restore to recovery database
gunzip -c backup_20240101_020000.sql.gz | \
  psql -h $DB_HOST -U $DB_USER -d care_commons_recovery
```

#### Step 4: Extract Deleted Records (10-20 minutes)
```bash
# Export affected records from recovery database
psql -h $DB_HOST -U $DB_USER -d care_commons_recovery -c "
  COPY (
    SELECT * FROM clients WHERE id IN (123, 456, 789)
  ) TO '/tmp/recovered_clients.csv' CSV HEADER;"

psql -h $DB_HOST -U $DB_USER -d care_commons_recovery -c "
  COPY (
    SELECT * FROM visits WHERE client_id IN (123, 456, 789)
  ) TO '/tmp/recovered_visits.csv' CSV HEADER;"
```

#### Step 5: Import into Production (10-15 minutes)
```bash
# Re-enable writes
psql -h $DB_HOST -U $DB_USER -d postgres -c "
  ALTER DATABASE care_commons SET default_transaction_read_only = off;"

# Import recovered data
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  COPY clients FROM '/tmp/recovered_clients.csv' CSV HEADER;"

psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  COPY visits FROM '/tmp/recovered_visits.csv' CSV HEADER;"
```

#### Step 6: Verify with User (5-10 minutes)
- Contact reporting user
- Verify data is restored correctly
- Check for any remaining issues
- Document in audit log

#### Step 7: Cleanup (5 minutes)
```bash
# Drop recovery database
dropdb -h $DB_HOST -U $DB_USER care_commons_recovery

# Remove temporary files
rm /tmp/recovered_*.csv

# Update audit log
psql -h $DB_HOST -U $DB_USER -d care_commons -c "
  INSERT INTO audit_logs (action, table_name, description, user_id)
  VALUES ('RECOVERY', 'clients', 'Recovered accidentally deleted records', 1);"
```

### Expected Timeline
**Total Time**: 45-80 minutes
- Identify scope: 5-10 min
- Stop changes: 2-5 min
- Create recovery DB: 10-15 min
- Extract records: 10-20 min
- Import to prod: 10-15 min
- Verify: 5-10 min
- Cleanup: 5 min

---

## Scenario 4: Ransomware Attack

### Detection
- Encrypted files with unusual extensions
- Ransom note in directories
- System files inaccessible
- Mass file modifications in short time
- Antivirus/EDR alerts

### ⚠️ CRITICAL: DO NOT PAY RANSOM

### Response Procedure

#### Step 1: IMMEDIATE ISOLATION (0-2 minutes)
```bash
# Disconnect affected systems from network
sudo ifconfig eth0 down

# Disable all network interfaces
sudo systemctl stop networking

# For AWS instances
aws ec2 modify-instance-attribute \
  --instance-id $INSTANCE_ID \
  --no-source-dest-check

# For cloud servers - security group isolation
aws ec2 revoke-security-group-ingress \
  --group-id $SG_ID \
  --ip-permissions '[{"IpProtocol": "-1", "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]'
```

#### Step 2: Activate Incident Response (2-5 minutes)
**IMMEDIATELY CONTACT:**
- Security team (HIGHEST PRIORITY)
- On-call engineer
- Database administrator
- Legal counsel
- Cyber insurance provider
- FBI Cyber Division (if in US): (855) 292-3937

#### Step 3: Preserve Evidence (10-15 minutes)
```bash
# DO NOT DELETE ANYTHING YET

# Take memory dump
sudo dd if=/dev/mem of=/mnt/external/memory-dump.raw bs=1M

# Document ransom note
cp /path/to/ransom-note.txt /mnt/external/evidence/

# Capture system state
ps aux > /mnt/external/evidence/processes.txt
netstat -tulpn > /mnt/external/evidence/network.txt
ls -laR / > /mnt/external/evidence/filesystem.txt

# Create disk image (if possible)
sudo dd if=/dev/sda of=/mnt/external/disk-image.raw bs=64K conv=noerror,sync
```

#### Step 4: Assess Damage (15-30 minutes)
```bash
# Check backup integrity (from isolated system)
ssh backup-server "find /var/backups/care-commons -name 'backup_*.sql.gz' -mtime -7"

# Verify backups are not encrypted
ssh backup-server "gunzip -t /var/backups/care-commons/backup_latest.sql.gz"

# Check S3 backups
aws s3 ls s3://$AWS_S3_BUCKET/backups/database/ --region us-east-1

# Identify extent of infection
find / -name "*.encrypted" -o -name "*.locked" -o -name "*DECRYPT*"
```

#### Step 5: Clean Environment Setup (30-60 minutes)
```bash
# Provision completely new infrastructure
# DO NOT use any existing infrastructure

# New AWS account or completely isolated environment
terraform workspace new disaster-recovery-clean
terraform apply -var="isolated=true"

# Scan backups before restoration
clamscan -r /var/backups/care-commons/

# Or use cloud antivirus
aws s3 sync s3://$BACKUP_BUCKET /tmp/scan-location
clamscan -r /tmp/scan-location
```

#### Step 6: Restore from Pre-Infection Backup (30-60 minutes)
```bash
# Identify last clean backup (before infection)
# Check backup dates against infection timeline

# Restore to clean environment
./scripts/restore-database.sh /clean-backups/backup_YYYYMMDD_HHMMSS.sql.gz

# Verify no malware in backup
grep -r "eval(" /restored-files/
grep -r "base64_decode" /restored-files/
```

#### Step 7: Change ALL Credentials (30-45 minutes)
```bash
# Database passwords
psql -c "ALTER USER postgres PASSWORD 'NEW_SECURE_PASSWORD';"

# Application secrets
vercel env rm DATABASE_URL
vercel env add DATABASE_URL "postgresql://new-credentials..."

# API keys
aws secretsmanager create-secret \
  --name care-commons/api-keys-new \
  --secret-string file://new-secrets.json

# SSH keys
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_new
# Deploy new keys to authorized_keys

# Admin passwords
# Force password reset for all users
psql -c "UPDATE users SET password_reset_required = true;"
```

#### Step 8: Security Hardening (1-2 hours)
```bash
# Update all software
apt update && apt upgrade -y

# Enable additional security
ufw enable
ufw default deny incoming
ufw allow 443/tcp
ufw allow 22/tcp

# Install security monitoring
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Configure intrusion detection
apt install aide
aideinit
```

#### Step 9: Monitoring and Verification (ongoing)
```bash
# Enhanced logging
rsyslog.conf: *.* @@siem-server:514

# File integrity monitoring
aide --check

# Network monitoring
tcpdump -i eth0 -w /var/log/network-capture.pcap

# Application monitoring
npm run test:security
npm run test:e2e
```

#### Step 10: Reporting and Compliance (1-3 days)
- **HIPAA Breach Notification** (if PHI compromised)
  - Notify HHS within 60 days
  - Notify affected individuals
  - Media notification (if >500 individuals)

- **Law Enforcement Report**
  - File FBI IC3 complaint
  - Contact local FBI field office

- **Insurance Claim**
  - Contact cyber insurance
  - Document all losses
  - Preserve evidence

- **Post-Incident Review**
  - Root cause analysis
  - Update security procedures
  - Staff training

### Expected Timeline
**Total Time**: 4-8 hours for immediate recovery, days for full remediation
- Isolation: 0-2 min
- Activate IR: 2-5 min
- Preserve evidence: 10-15 min
- Assess damage: 15-30 min
- Clean environment: 30-60 min
- Restore: 30-60 min
- Credential rotation: 30-45 min
- Security hardening: 1-2 hours
- Ongoing monitoring: continuous
- Reporting: 1-3 days

---

## General Best Practices

### Communication Templates

**Incident Start Notification**
```
INCIDENT ALERT: [Scenario Type]
Severity: [Critical/High/Medium]
Detection Time: [Timestamp]
Current Status: [Investigating/Responding/Recovering]
Expected Resolution: [Time estimate]
Impact: [User-facing impact description]
Next Update: [Time]
```

**Incident Resolution Notification**
```
INCIDENT RESOLVED: [Scenario Type]
Resolution Time: [Timestamp]
Duration: [Total time]
Root Cause: [Brief description]
Actions Taken: [Summary]
Preventive Measures: [What's being done]
Post-Mortem: [When/where]
```

### Post-Incident Checklist

- [ ] Complete incident timeline documentation
- [ ] Update runbook with lessons learned
- [ ] Schedule post-mortem meeting
- [ ] Test disaster recovery improvements
- [ ] Update contact information
- [ ] Review and update insurance coverage
- [ ] Conduct security audit
- [ ] Update disaster recovery plan
- [ ] Staff training on new procedures
- [ ] Verify backup integrity
- [ ] Test restored systems under load
- [ ] Customer communication follow-up

### Testing Schedule

- **Monthly**: Backup restoration test
- **Quarterly**: Disaster recovery drill (specific scenario)
- **Annually**: Full disaster recovery exercise (all scenarios)
- **After any incident**: Immediate test of updated procedures

### Key Metrics to Track

- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: 0 (zero data loss)
- **Backup Success Rate**: > 99.9%
- **Restoration Test Success**: 100%
- **Mean Time to Detect (MTTD)**: < 15 minutes
- **Mean Time to Respond (MTTR)**: < 30 minutes
- **Mean Time to Recover (MTTR)**: < 60 minutes

---

## Additional Resources

- Main Documentation: `/docs/DISASTER_RECOVERY.md`
- Backup Scripts: `/scripts/`
- Security Runbooks: `/docs/runbooks/`
- Compliance Documentation: `/docs/compliance/`
- Contact List: `/docs/ops/contacts.md` (create this)

## Revision History

- 2024-01-01: Initial version created
- [Add updates as procedures are tested and refined]
