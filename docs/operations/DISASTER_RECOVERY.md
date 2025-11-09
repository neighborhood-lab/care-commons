# Disaster Recovery Plan

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: Engineering Team
**Review Frequency**: Quarterly

---

## Executive Summary

This Disaster Recovery (DR) plan provides procedures for recovering the Care Commons platform in the event of a catastrophic failure. The plan defines recovery objectives, procedures, and responsibilities.

**Recovery Objectives**:
- **RTO (Recovery Time Objective)**: < 4 hours
- **RPO (Recovery Point Objective)**: < 5 minutes

---

## Disaster Scenarios

### Scenario 1: Complete Vercel Outage

**Probability**: Low
**Impact**: Complete service outage

**Indicators**:
- All Vercel deployments unreachable
- Vercel status page shows major incident
- Unable to access Vercel dashboard

**Recovery Procedure**:

1. **Verify Outage** (0-15 min):
   - Check Vercel status: https://www.vercel-status.com
   - Test multiple deployments
   - Contact Vercel support

2. **Communication** (15-30 min):
   - Post status update to users
   - Notify stakeholders
   - Set up incident bridge

3. **Monitor Vercel Status** (30 min - resolution):
   - Track Vercel incident updates
   - Prepare for traffic surge when service restores
   - Verify data integrity when service returns

4. **Alternative Deployment** (if outage > 4 hours):
   ```bash
   # Deploy to alternative platform (Railway, Render, Fly.io)
   # Pre-configured alternative deployment (maintain quarterly)
   # Update DNS to point to alternative deployment
   ```

### Scenario 2: Database Corruption/Loss

**Probability**: Very Low
**Impact**: Critical - Potential data loss

**Indicators**:
- Database queries failing
- Data inconsistencies detected
- Neon reports database corruption

**Recovery Procedure**:

1. **Immediate Assessment** (0-15 min):
   - Determine extent of corruption
   - Identify last known good state
   - Activate incident response team

2. **Stop Write Operations** (15-20 min):
   - Enable maintenance mode (if possible)
   - Prevent further data corruption

3. **Restore from Backup** (20 min - 2 hours):

   **Option A: Neon Point-in-Time Recovery**:
   ```
   1. Go to Neon Console: https://console.neon.tech
   2. Select affected project
   3. Navigate to "Branches"
   4. Create new branch from point-in-time:
      - Select timestamp before corruption
      - Name: "recovery-[timestamp]"
   5. Test recovery branch
   6. Switch DATABASE_URL to recovery branch
   7. Redeploy application
   ```

   **Option B: Restore from Manual Backup**:
   ```bash
   # If manual backups were taken
   # 1. Create new Neon database
   # 2. Restore from backup file
   psql $NEW_DATABASE_URL < backup-[date].sql

   # 3. Verify data integrity
   psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM users;"

   # 4. Update DATABASE_URL environment variable
   # 5. Redeploy application
   ```

4. **Verify Data Integrity** (2-3 hours):
   - Run data validation queries
   - Check critical tables
   - Verify recent transactions
   - Test application functionality

5. **Resume Operations** (3-4 hours):
   - Disable maintenance mode
   - Monitor error rates
   - Verify user operations
   - Communicate restoration

**Data Loss Assessment**:
- With Neon PITR: < 5 minutes of data loss (RPO)
- With manual backups: Depends on backup frequency

### Scenario 3: Security Breach

**Probability**: Low
**Impact**: Critical - HIPAA breach, compliance violation

**Indicators**:
- Unauthorized access detected
- Suspicious database queries
- User data exfiltration
- Credentials compromised

**Recovery Procedure**:

1. **Immediate Containment** (0-15 min):
   - Disable affected user accounts
   - Rotate all secrets (JWT, database, API keys)
   - Enable maintenance mode
   - Preserve evidence (logs, database state)

2. **Investigation** (15 min - 2 hours):
   - Identify breach vector
   - Determine data accessed/exfiltrated
   - Document timeline of events
   - Engage security team/consultants

3. **Remediation** (2-8 hours):
   - Patch security vulnerability
   - Deploy security fixes
   - Implement additional security controls
   - Full security audit

4. **Notification** (24-72 hours):
   - **HIPAA Requirement**: Notify affected individuals within 60 days
   - Notify Department of Health and Human Services
   - Notify media (if > 500 individuals affected)
   - Document breach and response

5. **Post-Incident** (1-2 weeks):
   - Conduct forensic analysis
   - Implement prevention measures
   - Update security procedures
   - Train team on new security practices

### Scenario 4: Catastrophic Data Loss

**Probability**: Very Low
**Impact**: Critical

**Indicators**:
- Accidental deletion of production database
- Malicious data deletion
- Backup system failure discovered

**Recovery Procedure**:

1. **Stop All Operations** (0-5 min):
   - Enable maintenance mode immediately
   - Prevent any further data modifications

2. **Assess Backup Status** (5-15 min):
   - Check Neon backup retention
   - Verify backup integrity
   - Identify recovery point

3. **Full Database Restore** (15 min - 4 hours):

   ```
   1. Access Neon Console
   2. Create new branch from last known good backup
   3. Verify backup contains expected data
   4. Create new Neon project (if necessary)
   5. Update DATABASE_URL to restored database
   6. Redeploy application
   ```

4. **Data Reconciliation** (4-8 hours):
   - Identify missing data (between backup and incident)
   - Recover from application logs if possible
   - Contact users for manual data re-entry (if necessary)
   - Document data loss

5. **Prevention** (Post-incident):
   - Implement additional backup verification
   - Add deletion safeguards
   - Implement backup testing schedule

---

## Recovery Procedures

### Emergency Contact List

**Incident Commander** (Decides on DR activation):
- Name: [Engineering Manager]
- Phone: [Phone]
- Email: [Email]

**Technical Lead**:
- Name: [Tech Lead]
- Phone: [Phone]
- Email: [Email]

**Database Administrator**:
- Name: [DBA/DevOps]
- Phone: [Phone]
- Email: [Email]

**External Support**:
- **Vercel Enterprise Support**: support@vercel.com, [Account Rep if available]
- **Neon Support**: support@neon.tech
- **Security Consultant**: [If engaged]

### Communication Protocols

**Internal Communication**:
1. Create #dr-incident Slack channel
2. Start incident bridge call
3. Hourly status updates to team
4. Executive summary every 2 hours

**External Communication**:
1. Status page update (if available)
2. User notification email (template in STAKEHOLDER_COMMUNICATIONS.md)
3. Social media updates (if applicable)
4. Regulatory notifications (if data breach)

### Recovery Checklist

**Phase 1: Assessment (0-30 min)**:
- [ ] Identify disaster type
- [ ] Assess impact and scope
- [ ] Activate DR team
- [ ] Establish communication channels
- [ ] Notify stakeholders

**Phase 2: Containment (30 min - 2 hours)**:
- [ ] Prevent further damage
- [ ] Enable maintenance mode (if applicable)
- [ ] Preserve evidence
- [ ] Document current state

**Phase 3: Recovery (2-4 hours)**:
- [ ] Execute recovery procedure for scenario
- [ ] Restore from backups (if needed)
- [ ] Verify data integrity
- [ ] Test critical functionality
- [ ] Security scan (if breach-related)

**Phase 4: Verification (4-6 hours)**:
- [ ] Full system testing
- [ ] Data validation
- [ ] Performance verification
- [ ] Security verification
- [ ] User acceptance testing

**Phase 5: Restoration (6-8 hours)**:
- [ ] Disable maintenance mode
- [ ] Resume normal operations
- [ ] Monitor error rates
- [ ] Monitor user feedback
- [ ] Gradual traffic ramp-up

**Phase 6: Post-Incident (24-72 hours)**:
- [ ] Post-mortem meeting
- [ ] Incident report documentation
- [ ] Root cause analysis
- [ ] Update DR procedures
- [ ] Implement preventive measures

---

## Backup Strategy

### Automated Backups (Primary)

**Neon Managed Backups**:
- **Frequency**: Continuous (point-in-time recovery)
- **Retention**: 30 days (Neon Pro plan)
- **Type**: Full database snapshots + transaction logs
- **Location**: AWS S3 (multi-region)
- **Encryption**: AES-256 at rest
- **Testing**: Quarterly restore drills

**Verification**:
```
1. Monthly: Verify backups exist in Neon console
2. Quarterly: Test restore to new branch
3. Annually: Full DR drill with complete restore
```

### Manual Backups (Secondary)

**Export Schedule**:
- **Frequency**: Weekly (Sunday 2:00 AM UTC)
- **Automation**: GitHub Actions workflow
- **Storage**: AWS S3 bucket (encrypted)
- **Retention**: 90 days

**Manual Backup Procedure**:
```bash
# Create timestamped backup
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://care-commons-backups/manual/ \
  --sse AES256

# Verify upload
aws s3 ls s3://care-commons-backups/manual/${BACKUP_FILE}.gz
```

### Configuration Backups

**Repository Backup**:
- GitHub repository (primary)
- All configuration in git
- Secrets documented (not stored in git)

**Environment Variables**:
- Documented in `.env.example`
- Backed up in secure password manager
- Quarterly verification

---

## Testing and Drills

### Disaster Recovery Drill Schedule

**Quarterly DR Drills**:
- **Q1**: Database restore drill (Neon PITR)
- **Q2**: Full application recovery drill
- **Q3**: Security incident response drill
- **Q4**: Multi-scenario tabletop exercise

### DR Drill Procedure

**1. Planning Phase** (1 week before):
- [ ] Schedule drill (choose low-traffic time)
- [ ] Notify team of drill date/time
- [ ] Prepare drill scenario
- [ ] Assign roles
- [ ] Set up monitoring

**2. Execution Phase** (2-4 hours):
- [ ] Simulate disaster scenario
- [ ] Execute recovery procedures
- [ ] Time each phase
- [ ] Document issues encountered
- [ ] Test communication protocols

**3. Review Phase** (1 week after):
- [ ] Debrief meeting
- [ ] Document lessons learned
- [ ] Update DR procedures
- [ ] Create action items
- [ ] Schedule remediation

### Drill Success Criteria

- [ ] Recovery completed within RTO (< 4 hours)
- [ ] Data loss within RPO (< 5 minutes)
- [ ] All team members know their roles
- [ ] Communication protocols effective
- [ ] Documentation accurate and complete

---

## Recovery Time Objectives

| Component | RTO | RPO | Recovery Method |
|-----------|-----|-----|-----------------|
| Application (Vercel) | 30 min | 0 | Redeploy from git |
| Database (Neon) | 1 hour | 5 min | Point-in-time recovery |
| Full System | 4 hours | 5 min | Combined recovery |
| Alternative Platform | 8 hours | 5 min | Deploy to backup provider |

---

## Data Recovery Priority

**Priority 1 - Critical (Must recover)**:
- User authentication data
- Client PHI (Protected Health Information)
- Visit records (EVV compliance)
- Caregiver certifications
- Billing records

**Priority 2 - Important (Should recover)**:
- Care plans and tasks
- Family engagement data
- Audit logs
- Organization configurations

**Priority 3 - Nice to have**:
- Demo data
- Non-critical logs
- Temporary session data

---

## Preventive Measures

### Current Safeguards

- [x] Neon automated backups (continuous PITR)
- [x] Multi-region cloud storage (AWS S3)
- [x] Encrypted backups (AES-256)
- [x] Application code in git (GitHub)
- [x] Infrastructure as code (Vercel config)
- [x] Database migration tracking
- [x] Health monitoring (Sentry, Prometheus)
- [x] Rate limiting (prevent abuse)
- [x] Authentication security (OAuth, JWT)
- [x] Audit logging (compliance)

### Recommended Enhancements

- [ ] Set up automated weekly backup exports to S3
- [ ] Configure cross-region backup replication
- [ ] Implement database transaction log shipping
- [ ] Set up alternative deployment platform (standby)
- [ ] Create automated DR testing workflow
- [ ] Implement chaos engineering practices
- [ ] Set up real-time backup monitoring alerts
- [ ] Document and test multi-region failover

---

## Compliance Considerations

### HIPAA Requirements

**Breach Notification**:
- Notify affected individuals: Within 60 days
- Notify HHS: Within 60 days (or annually if < 500 affected)
- Notify media: Within 60 days (if > 500 affected in same state)

**Documentation**:
- Maintain breach log
- Document risk assessment
- Record notification dates
- Preserve evidence

**Recovery Requirements**:
- Verify PHI integrity after recovery
- Ensure audit logs preserved
- Maintain chain of custody
- Document recovery procedures

### EVV Compliance

**State Requirements**:
- Maintain 7-year records retention
- Ensure visit data integrity
- Verify GPS data accuracy
- Preserve audit trail

**Recovery Verification**:
- Verify all visit records recovered
- Check GPS coordinates intact
- Validate timestamp accuracy
- Confirm caregiver-client assignments

---

## Post-Disaster Actions

### Immediate (Within 24 hours)

- [ ] Document incident timeline
- [ ] Preserve all logs and evidence
- [ ] Verify system stability
- [ ] Monitor for recurring issues
- [ ] Communicate resolution to stakeholders

### Short-term (Within 1 week)

- [ ] Conduct post-mortem meeting
- [ ] Create detailed incident report
- [ ] Identify root cause
- [ ] Implement immediate fixes
- [ ] Update DR procedures

### Long-term (Within 1 month)

- [ ] Implement preventive measures
- [ ] Update monitoring and alerting
- [ ] Enhance backup procedures
- [ ] Conduct follow-up DR drill
- [ ] Train team on new procedures

---

## Appendix: Recovery Commands

### Database Recovery

```bash
# Neon Point-in-Time Recovery (via console)
# 1. https://console.neon.tech → Project → Branches
# 2. "Create branch" → "Point in time" → Select timestamp
# 3. Update DATABASE_URL environment variable
# 4. Redeploy application

# Manual restore from backup
createdb recovery_db
psql recovery_db < backup-20250101.sql

# Verify data
psql recovery_db -c "SELECT COUNT(*) FROM users;"
psql recovery_db -c "SELECT COUNT(*) FROM visits;"
```

### Application Recovery

```bash
# Redeploy current version
git pull origin main
vercel deploy --prod

# Deploy specific version
git checkout [commit-sha]
vercel deploy --prod

# Verify deployment
curl https://[domain]/health
```

### Emergency Contacts Quick Reference

```
Vercel Support: support@vercel.com
Neon Support: support@neon.tech
Sentry Support: support@sentry.io
GitHub Support: support@github.com

On-Call Engineer: [Phone]
Tech Lead: [Phone]
Engineering Manager: [Phone]
```

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Review**: 2026-02-08 (Quarterly)
**Last DR Drill**: [Schedule first drill]
