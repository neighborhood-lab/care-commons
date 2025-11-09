# Rollback Procedures

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: Engineering Team

---

## Table of Contents

1. [Overview](#overview)
2. [When to Rollback](#when-to-rollback)
3. [Rollback Methods](#rollback-methods)
4. [Emergency Rollback Procedure](#emergency-rollback-procedure)
5. [Database Rollback](#database-rollback)
6. [Post-Rollback Actions](#post-rollback-actions)
7. [Testing Rollback Procedures](#testing-rollback-procedures)

---

## Overview

This document outlines the procedures for rolling back a production deployment when critical issues are detected. Rollbacks should be executed quickly but carefully to minimize service disruption and prevent data loss.

**Key Principles**:
- **Speed**: Rollbacks should complete within 5-10 minutes
- **Safety**: Never rollback database migrations without careful consideration
- **Communication**: Always notify team and stakeholders
- **Documentation**: Document the issue and rollback decision

---

## When to Rollback

### Automatic Rollback Triggers

The system will automatically rollback in these scenarios:

1. **Health Check Failure**: `/health` endpoint returns non-200 status after deployment
2. **Build Failure**: Application build fails during deployment
3. **Critical Error Rate**: Error rate > 10% within first 5 minutes

### Manual Rollback Decision Criteria

#### CRITICAL - Immediate Rollback (< 5 minutes)

**Security Incidents**:
- Authentication bypass discovered
- Unauthorized data access detected
- SQL injection vulnerability found
- Credentials leaked
- HIPAA compliance breach

**Data Integrity**:
- Data corruption detected
- Data deletion bug causing data loss
- Database migration caused data loss
- Sync bugs causing conflicting data

**Complete Service Outage**:
- Application crashes on startup (all instances)
- Database connectivity completely lost
- All API requests returning 500 errors
- Unable to authenticate any users

#### HIGH Priority - Rollback Within 15 Minutes

**High Error Rate**:
- Error rate > 5% sustained for 10+ minutes
- Critical user flows completely broken:
  - Cannot log in
  - Cannot create visits
  - Cannot clock in/out
  - Mobile sync completely failing

**Severe Performance**:
- Response time p95 > 5 seconds sustained
- Database queries timing out
- Connection pool completely exhausted
- Application becomes unusable

**Compliance**:
- EVV data not being captured correctly
- Audit logging completely failing
- Required PHI encryption not working

#### MEDIUM Priority - Investigate First (30-60 minutes)

**Moderate Issues**:
- Error rate 1-5% sustained
- Non-critical features broken
- Performance degradation (p95 > 1 second)
- User reports of specific bugs

**Decision Process**:
1. Assess impact (how many users affected?)
2. Check if hotfix is possible (< 30 minutes)
3. If hotfix not feasible → rollback
4. If impact is low → monitor and plan hotfix

---

## Rollback Methods

### Method 1: Vercel Instant Rollback (Recommended)

**Best for**: Application code issues (no database changes)

**Advantages**:
- Fastest method (< 2 minutes)
- No code changes required
- One-click rollback in dashboard

**Limitations**:
- Does not rollback database migrations
- Must handle database migration rollback separately

**Procedure**:

1. **Via Vercel Dashboard**:
   ```
   1. Go to https://vercel.com/[your-org]/[your-project]
   2. Click "Deployments" tab
   3. Find the last known good deployment
   4. Click "..." menu → "Promote to Production"
   5. Confirm the rollback
   ```

2. **Via Vercel CLI**:
   ```bash
   # List recent deployments
   vercel list

   # Promote previous deployment to production
   vercel promote [deployment-url]
   ```

**Expected Duration**: 1-2 minutes

### Method 2: GitHub Actions Rollback Workflow

**Best for**: Structured rollback with team notification

**Procedure**:

1. **Trigger Rollback Workflow**:
   ```
   1. Go to GitHub → Actions → "Rollback Production"
   2. Click "Run workflow"
   3. Select branch: main
   4. Input: Previous deployment SHA or tag
   5. Click "Run workflow"
   ```

2. **Automated Steps**:
   - Checks out previous commit
   - Runs tests
   - Deploys to Vercel
   - Runs health checks
   - Posts notification to Slack

**Expected Duration**: 5-10 minutes

### Method 3: Git Revert and Redeploy

**Best for**: When specific commits need to be reverted

**Procedure**:

```bash
# 1. Identify the problematic commit
git log --oneline -10

# 2. Create revert commit
git revert [bad-commit-sha]

# Or revert multiple commits
git revert [sha-1] [sha-2] [sha-3]

# 3. Push to main (triggers automatic deployment)
git push origin main

# 4. Monitor deployment
# GitHub Actions will automatically deploy the revert
```

**Expected Duration**: 10-15 minutes

### Method 4: Emergency Hotfix

**Best for**: Simple bugs with obvious fixes

**When to use**:
- Bug has clear, simple fix (< 10 lines of code)
- Fix can be implemented in < 15 minutes
- Error rate is moderate (1-5%), not critical

**Procedure**:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug-fix

# 2. Make minimal fix

# 3. Test locally
npm run lint
npm run type-check
npm test

# 4. Push and create PR
git push origin hotfix/critical-bug-fix

# 5. Get fast-track approval (1 reviewer minimum)

# 6. Merge to main (triggers deployment)

# 7. Monitor closely
```

**Expected Duration**: 20-30 minutes

---

## Emergency Rollback Procedure

**Use this for CRITICAL issues requiring immediate action**

### Step 1: Alert the Team (0-2 minutes)

```
1. Post in #incidents Slack channel:
   "@here CRITICAL: Rolling back production deployment
   Reason: [brief description]
   Triggered by: [your name]
   Method: [Vercel instant rollback / GitHub Actions / etc]"

2. Start incident call (if available):
   - Google Meet / Zoom link in Slack channel
```

### Step 2: Execute Rollback (2-5 minutes)

**Fastest Method - Vercel Dashboard**:

```
1. Open: https://vercel.com/[your-org]/[your-project]/deployments

2. Identify last known good deployment:
   - Look for most recent deployment before current
   - Verify it has "Ready" status
   - Check timestamp matches pre-issue deployment

3. Click "..." menu next to that deployment

4. Select "Promote to Production"

5. Confirm: "Yes, promote to production"

6. Wait for promotion to complete (~60 seconds)
```

### Step 3: Verify Rollback (5-7 minutes)

```bash
# 1. Check health endpoint
curl https://[your-domain]/health

# Expected: {"status": "healthy", ...}

# 2. Check Sentry for new errors
# Open: https://sentry.io/organizations/[your-org]/issues

# 3. Test critical flows manually:
# - User login
# - Create test visit
# - Mobile sync

# 4. Check metrics
curl -H "Authorization: Bearer $TOKEN" https://[domain]/metrics

# Verify error rate dropping
```

### Step 4: Communicate Status (7-10 minutes)

```
1. Update #incidents channel:
   "Rollback complete. Services restored to [previous version].
   Health checks: ✅ Passing
   Error rate: [current rate]
   Investigating root cause."

2. If user-facing impact, post status update:
   - Internal status page
   - Customer communication (if applicable)
```

### Step 5: Root Cause Analysis (Post-Rollback)

```
1. Preserve evidence:
   - Save Sentry errors
   - Export logs from failed deployment
   - Screenshot metrics/dashboards

2. Schedule post-mortem:
   - Within 24 hours
   - All relevant team members
   - Blameless retrospective

3. Create follow-up tasks:
   - Fix root cause
   - Add tests to prevent recurrence
   - Update deployment procedures if needed
```

---

## Database Rollback

**⚠️ WARNING**: Database rollbacks are risky and can cause data loss. Only perform if absolutely necessary.

### When to Rollback Database Migrations

**Only in these scenarios**:
1. Migration caused data corruption
2. Migration caused complete data loss
3. Migration broke critical functionality and hotfix impossible
4. Migration exposed security vulnerability

**Do NOT rollback for**:
- Application code issues (rollback app only)
- Performance issues (investigate first)
- Minor bugs (hotfix instead)

### Database Rollback Procedure

#### Step 1: Assessment (Critical)

```
BEFORE rolling back database, answer:

1. Will rollback cause data loss?
   - Were new columns added with user data?
   - Were records created that depend on new schema?

2. Is there an alternative?
   - Can we add a hotfix migration instead?
   - Can we rollback app code only?

3. What is the rollback scope?
   - How many migrations to rollback?
   - What is the data impact?

Only proceed if rollback is absolutely necessary and data loss is acceptable.
```

#### Step 2: Database Backup (CRITICAL)

```bash
# ALWAYS take backup before rollback

# Connect to Neon dashboard
# 1. Go to https://console.neon.tech
# 2. Select your project
# 3. Go to "Branches" tab
# 4. Create new branch from main: "backup-before-rollback-[timestamp]"
# 5. Wait for branch creation (creates point-in-time snapshot)

# Alternative: Manual backup
# Export database to SQL file
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Upload backup to secure location
# aws s3 cp backup-*.sql s3://[backup-bucket]/emergency-backups/
```

#### Step 3: Execute Migration Rollback

```bash
# Check current migration status
npm run db:migrate:status

# Rollback ONE migration at a time
npm run db:migrate:rollback

# Verify migration rolled back successfully
npm run db:migrate:status

# If multiple migrations need rollback, repeat:
npm run db:migrate:rollback

# After each rollback, verify:
# 1. Application still functions
# 2. No data loss
# 3. No error spikes
```

#### Step 4: Verify Application Compatibility

```bash
# After database rollback, verify app works with old schema

# 1. Run health check
curl https://[domain]/health

# 2. Test database queries
# Check logs for database errors

# 3. If current application incompatible with rolled-back schema:
# → Must also rollback application code (see Method 1 above)
```

#### Step 5: Data Verification

```sql
-- Connect to database
psql $DATABASE_URL

-- Check critical tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM visits;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM caregivers;

-- Compare with expected counts
-- Verify no unexpected data loss
```

### Database Rollback Alternatives

**Instead of rollback, consider**:

1. **Forward Migration** (Preferred):
   ```bash
   # Create new migration to fix issue
   npm run db:migration:make fix_previous_migration

   # Edit migration file to fix the problem
   # Then deploy
   ```

2. **Hotfix Migration**:
   ```bash
   # Add migration that undoes problematic changes
   # Without rolling back
   ```

3. **Feature Flag**:
   ```javascript
   // Disable feature using environment variable
   if (process.env.ENABLE_NEW_FEATURE !== 'true') {
     // Use old code path
   }
   ```

---

## Post-Rollback Actions

### Immediate Actions (Within 1 Hour)

1. **Verify System Stability**:
   - [ ] Monitor error rate for 30 minutes
   - [ ] Verify health checks passing
   - [ ] Check database performance
   - [ ] Monitor user activity

2. **Communication**:
   - [ ] Update #incidents channel with final status
   - [ ] Notify stakeholders of resolution
   - [ ] Post user-facing status update (if applicable)

3. **Preserve Evidence**:
   - [ ] Export logs from failed deployment
   - [ ] Save Sentry errors and stack traces
   - [ ] Screenshot metrics showing issue
   - [ ] Export database state (if relevant)

### Short-Term Actions (Within 24 Hours)

1. **Root Cause Analysis**:
   - [ ] Identify what went wrong
   - [ ] Determine why it wasn't caught in testing
   - [ ] Document findings

2. **Create Fix**:
   - [ ] Create ticket for proper fix
   - [ ] Assign owner
   - [ ] Add tests to prevent recurrence

3. **Post-Mortem**:
   - [ ] Schedule blameless post-mortem meeting
   - [ ] Document timeline of events
   - [ ] Identify action items for prevention

### Long-Term Actions (Within 1 Week)

1. **Improve Testing**:
   - [ ] Add tests that would have caught the issue
   - [ ] Improve E2E test coverage
   - [ ] Add integration tests

2. **Update Procedures**:
   - [ ] Update deployment checklist
   - [ ] Improve pre-deployment testing
   - [ ] Update rollback procedures (if needed)

3. **Implement Fix**:
   - [ ] Deploy proper fix with comprehensive testing
   - [ ] Verify fix resolves root cause
   - [ ] Monitor for recurrence

---

## Testing Rollback Procedures

**Test rollback procedures quarterly to ensure readiness**

### Rollback Drill Procedure

1. **Schedule Drill**:
   - Choose low-traffic time (e.g., Tuesday 2 PM)
   - Notify team of drill
   - Use staging/preview environment

2. **Execute Simulated Rollback**:
   ```bash
   # 1. Deploy to preview
   vercel deploy --preview

   # 2. Simulate issue detection

   # 3. Execute rollback procedure
   vercel promote [previous-deployment]

   # 4. Verify rollback successful

   # 5. Time the process
   ```

3. **Review and Improve**:
   - Document time taken
   - Identify friction points
   - Update procedures
   - Train team members

### Checklist for Rollback Drills

- [ ] All team members know how to access Vercel dashboard
- [ ] All team members can identify last known good deployment
- [ ] Rollback can be executed in < 5 minutes
- [ ] Team knows database rollback risks
- [ ] Communication channels tested
- [ ] Monitoring dashboards accessible

---

## Rollback Decision Matrix

| Issue Type | Impact | Response Time | Action |
|------------|--------|---------------|---------|
| Security breach | Critical | Immediate | Rollback + incident response |
| Data loss/corruption | Critical | Immediate | Rollback + restore backup |
| Complete outage | Critical | < 5 min | Rollback |
| Error rate > 5% | High | < 15 min | Rollback (if no quick fix) |
| Error rate 1-5% | Medium | < 30 min | Investigate, then rollback or hotfix |
| Performance degradation | Medium | < 30 min | Investigate, then decide |
| Minor bug | Low | N/A | Create fix, deploy normally |

---

## Emergency Contacts

**Rollback Authority** (can approve rollback):
1. On-call engineer (any severity)
2. Tech lead (CRITICAL/HIGH)
3. Engineering manager (CRITICAL)

**Required Notification**:
- Slack: #incidents channel
- On-call: Primary and secondary
- Management: For CRITICAL issues

**External Support**:
- **Vercel**: support@vercel.com (for deployment issues)
- **Neon**: support@neon.tech (for database issues)
- **Sentry**: support@sentry.io (for monitoring issues)

---

## Appendix: Rollback Commands Reference

```bash
# Vercel - List deployments
vercel list --scope [your-org]

# Vercel - Promote specific deployment
vercel promote [deployment-url]

# Git - Revert commit
git revert [commit-sha]

# Git - Revert multiple commits
git revert [sha1] [sha2] [sha3]

# Database - Check migration status
npm run db:migrate:status

# Database - Rollback one migration
npm run db:migrate:rollback

# Database - Backup
pg_dump $DATABASE_URL > backup.sql

# Health check
curl https://[domain]/health

# Metrics check
curl -H "Authorization: Bearer $TOKEN" https://[domain]/metrics
```

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Review**: After first rollback or quarterly
**Last Drill**: [Schedule first drill]
