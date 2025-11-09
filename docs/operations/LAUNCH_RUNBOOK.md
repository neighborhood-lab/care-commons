# Production Launch Runbook

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: Engineering Team

---

## Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Launch Day Timeline](#launch-day-timeline)
3. [Launch Procedures](#launch-procedures)
4. [Post-Launch Monitoring](#post-launch-monitoring)
5. [Rollback Triggers](#rollback-triggers)
6. [Communication Protocols](#communication-protocols)
7. [Contact Information](#contact-information)

---

## Pre-Launch Checklist

### T-7 Days: Final Preparations

- [ ] **Code Freeze**: Merge final features to main branch
- [ ] **Security Review**: Review all security configurations
- [ ] **Performance Testing**: Complete load testing (see `LOAD_TESTING.md`)
- [ ] **Documentation Review**: Verify all docs are up-to-date
- [ ] **Stakeholder Notification**: Send pre-launch communication
- [ ] **Support Training**: Brief support team (see `SUPPORT_BRIEF.md`)
- [ ] **Backup Verification**: Test database restore procedure
- [ ] **Monitoring Setup**: Verify all monitoring tools configured

### T-3 Days: Environment Preparation

- [ ] **Production Environment Variables**:
  - [ ] Verify all environment variables in Vercel dashboard
  - [ ] Confirm `DATABASE_URL` points to production Neon database
  - [ ] Set `NODE_ENV=production`
  - [ ] Configure `SENTRY_DSN` for error tracking
  - [ ] Set `JWT_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars)
  - [ ] Configure `ENCRYPTION_KEY` (32 bytes)
  - [ ] Set `CORS_ORIGIN` to production domain(s)
  - [ ] Configure Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
  - [ ] Optional: Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting

- [ ] **Database Setup**:
  - [ ] Run production migrations: `npm run db:migrate`
  - [ ] Verify migration status: `npm run db:migrate:status`
  - [ ] Run production seed (minimal data): `npm run db:seed`
  - [ ] Verify database indexes
  - [ ] Confirm backup schedule active

- [ ] **Monitoring Configuration**:
  - [ ] Configure Sentry alerts (critical errors, high error rate)
  - [ ] Set up external uptime monitoring (UptimeRobot, Pingdom)
  - [ ] Configure Prometheus scraping (if using external Prometheus)
  - [ ] Set up log aggregation (Vercel logs retention)
  - [ ] Configure PagerDuty/Slack alerts

- [ ] **DNS and SSL**:
  - [ ] Configure custom domain in Vercel
  - [ ] Verify SSL certificate provisioned
  - [ ] Test HTTPS enforcement
  - [ ] Verify redirects working

### T-1 Day: Final Verification

- [ ] **Smoke Tests**:
  - [ ] Run E2E smoke tests: `npm run test:smoke`
  - [ ] Manual testing of critical flows:
    - [ ] User login (Google OAuth)
    - [ ] Client creation
    - [ ] Caregiver registration
    - [ ] Visit scheduling
    - [ ] Visit clock-in/out (mobile)
    - [ ] Family portal access

- [ ] **Performance Baseline**:
  - [ ] Record current `/metrics` output
  - [ ] Document baseline response times
  - [ ] Verify health check responses: `/health`

- [ ] **Team Preparation**:
  - [ ] Confirm on-call rotation schedule
  - [ ] Verify contact list up-to-date
  - [ ] Review rollback procedures with team
  - [ ] Conduct final team briefing

- [ ] **Deployment Dry Run**:
  - [ ] Deploy to preview environment
  - [ ] Run full test suite against preview
  - [ ] Verify migrations run successfully
  - [ ] Test rollback procedure in preview

---

## Launch Day Timeline

### Launch Window: [Recommended: Tuesday-Thursday, 10:00 AM - 2:00 PM local time]

**Why mid-week, mid-day?**
- Full team availability for monitoring
- Avoids Friday deployments (limited weekend support)
- Avoids Monday (potential weekend issues)
- Business hours allow immediate user feedback

### Hour-by-Hour Schedule

#### H-1: Final Preparation (9:00 AM)

**Time**: 9:00 AM - 10:00 AM

- [ ] **Team Assembly**: All hands on deck (engineers, support, product)
- [ ] **Communication Check**: Verify all communication channels working
- [ ] **Monitoring Check**: Verify all monitoring dashboards accessible
- [ ] **Go/No-Go Decision**: Final approval from stakeholders

**No-Go Criteria**:
- Critical bugs identified
- Monitoring systems down
- Key team members unavailable
- External dependencies unavailable

#### H-0: Launch (10:00 AM)

**Time**: 10:00 AM - 10:30 AM

- [ ] **10:00 AM**: Merge to main branch (triggers automatic deployment)
- [ ] **10:05 AM**: Monitor deployment logs in Vercel
- [ ] **10:10 AM**: Verify database migrations completed successfully
- [ ] **10:15 AM**: Check health endpoints:
  - `GET https://[domain]/health` should return `{"status": "healthy"}`
  - `GET https://[domain]/health/geocoding` should verify provider
- [ ] **10:20 AM**: Smoke test critical endpoints
- [ ] **10:25 AM**: Send "Deployment Complete" notification to team

**Success Criteria**:
- Deployment status: "Ready" in Vercel
- Health check: 200 OK
- No errors in Sentry
- Database connections healthy

#### H+1: Initial Monitoring (11:00 AM)

**Time**: 10:30 AM - 11:00 AM

- [ ] **Monitor Sentry**: Check for new errors/crashes
- [ ] **Monitor Vercel Logs**: Review application logs
- [ ] **Monitor Metrics**: Check `/metrics` endpoint
  - HTTP request rates
  - Response times
  - Database query durations
  - Error rates
- [ ] **Test User Flows**:
  - Admin login
  - Create test client
  - Create test visit
  - Mobile app sync
- [ ] **Check Performance**:
  - Average response time < 200ms
  - 95th percentile < 500ms
  - Database queries < 100ms

**Rollback Triggers**: See [Rollback Triggers](#rollback-triggers)

#### H+2: User Communication (12:00 PM)

**Time**: 11:00 AM - 12:00 PM

- [ ] **Send Launch Announcement**: Email to stakeholders (use template)
- [ ] **Enable User Access**: Remove any "maintenance mode" restrictions
- [ ] **Monitor User Activity**:
  - Watch active user count
  - Monitor login success rate
  - Check for user-reported issues
- [ ] **Support Readiness**: Support team monitoring Slack/email

#### H+4: Mid-Day Check (2:00 PM)

**Time**: 12:00 PM - 2:00 PM

- [ ] **Review Metrics**:
  - Total requests processed
  - Error rate < 1%
  - No critical errors in Sentry
  - Database performance stable
- [ ] **User Feedback**: Review any user-reported issues
- [ ] **Performance**: Verify no degradation
- [ ] **Capacity**: Check database connection pool utilization

**Success Criteria**:
- No critical issues reported
- Error rate within acceptable range (< 1%)
- Performance meeting SLAs
- User feedback positive or neutral

#### End of Day: Day 1 Summary (5:00 PM)

**Time**: 5:00 PM

- [ ] **Metrics Summary**:
  - Total users active
  - Total visits created
  - Total API requests
  - Average response time
  - Error count and types
- [ ] **Issue Review**: Document any issues encountered
- [ ] **Team Debrief**: 30-minute team sync
- [ ] **Stakeholder Update**: Send end-of-day summary
- [ ] **On-Call Handoff**: Brief evening/night on-call engineer

---

## Launch Procedures

### 1. Deployment Execution

```bash
# Ensure you're on main branch with latest code
git checkout main
git pull origin main

# Verify all tests pass
npm run lint
npm run type-check
npm test
npm run build

# Deployment happens automatically when pushing to main
# GitHub Actions will:
# 1. Run CI tests
# 2. Build application
# 3. Run database migrations
# 4. Deploy to Vercel
# 5. Run health checks
```

**Automatic Deployment via GitHub Actions**:
- Push to `main` triggers `.github/workflows/deploy.yml`
- Workflow runs migrations automatically
- Deployment to Vercel
- Health check verification
- Automatic rollback if health checks fail

### 2. Database Migration Verification

```bash
# Check migration status
npm run db:migrate:status

# Expected output:
# Migration files:
# [✓] 001_initial_schema.ts
# [✓] 002_auth_tables.ts
# ...
# All migrations completed successfully
```

### 3. Health Check Verification

```bash
# Test health endpoint
curl https://[your-domain]/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-08T10:00:00.000Z",
  "database": "connected",
  "uptime": 60,
  "environment": "production"
}

# Test geocoding health
curl https://[your-domain]/health/geocoding

# Expected response:
{
  "status": "healthy",
  "provider": "google",
  "timestamp": "2025-11-08T10:00:00.000Z"
}
```

### 4. Smoke Test Critical Paths

**Authentication**:
```bash
# Test Google OAuth flow (manual browser test)
# 1. Navigate to https://[your-domain]/login
# 2. Click "Sign in with Google"
# 3. Verify redirect to Google
# 4. Authorize application
# 5. Verify redirect back and successful login
```

**API Endpoint Test**:
```bash
# Get auth token (after login)
TOKEN="your-jwt-token"

# Test API endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://[your-domain]/api/organizations

# Expected: 200 OK with organization data
```

**Mobile Sync Test**:
```bash
# Test sync endpoint
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lastPulledAt": null}' \
  https://[your-domain]/api/sync/pull

# Expected: 200 OK with sync data
```

### 5. Monitoring Dashboard Access

**Sentry**: https://sentry.io/organizations/[your-org]/projects/
- Check for new errors
- Verify error rate < 1%

**Vercel Dashboard**: https://vercel.com/[your-org]/[your-project]
- Deployment status
- Real-time logs
- Analytics

**Prometheus Metrics**: https://[your-domain]/metrics
- Requires authentication
- Use for performance monitoring

---

## Post-Launch Monitoring

### First 24 Hours: Intensive Monitoring

**Hourly Checks** (H+1 to H+24):

1. **Sentry Dashboard**:
   - New errors/crashes
   - Error frequency
   - Affected users

2. **Vercel Analytics**:
   - Request volume
   - Response times (avg, p50, p95, p99)
   - Status code distribution

3. **Database Health**:
   - Connection pool utilization (should be < 80%)
   - Query performance (< 100ms average)
   - Long-running queries

4. **Metrics Endpoint** (`/metrics`):
   ```bash
   curl -H "Authorization: Bearer $TOKEN" https://[domain]/metrics
   ```
   - `http_requests_total`: Track request volume
   - `http_request_duration_seconds`: Track latency
   - `db_query_duration_seconds`: Database performance
   - `active_users`: Current active users

5. **User Feedback**:
   - Support tickets
   - User-reported bugs
   - Feature requests

**Alert Thresholds** (First 24 hours):

- **Critical**: Error rate > 5% (immediate rollback consideration)
- **High**: Error rate > 1% (investigate immediately)
- **Medium**: Response time p95 > 1000ms
- **Low**: Response time p95 > 500ms

### Days 2-7: Daily Monitoring

**Daily Checks** (Once per day):

- [ ] Review Sentry error summary
- [ ] Check Vercel analytics trends
- [ ] Verify backup completion
- [ ] Review database performance
- [ ] Check user growth metrics
- [ ] Review support tickets

**Weekly Summary** (End of Week 1):

- Total users onboarded
- Total visits tracked
- Error rate trends
- Performance trends
- User feedback summary
- Action items for Week 2

### Week 2+: Normal Operations

**Transition to Standard Monitoring**:

- Move to standard on-call rotation
- Weekly metrics review
- Monthly performance review
- Quarterly capacity planning

---

## Rollback Triggers

### Automatic Rollback Criteria

The deployment will automatically rollback if:

- Health check fails after deployment
- Critical error rate > 10% within 5 minutes
- Database migration fails

### Manual Rollback Triggers

**CRITICAL - Immediate Rollback Required**:

1. **Security Breach**:
   - Unauthorized access detected
   - Data leak identified
   - Authentication bypass discovered

2. **Data Loss**:
   - Database corruption detected
   - Data deletion bugs identified
   - Sync conflicts causing data loss

3. **Complete Service Failure**:
   - Application crashes on startup
   - Database connectivity completely lost
   - All requests returning 500 errors

**HIGH - Rollback Within 30 Minutes**:

1. **High Error Rate**:
   - Error rate > 5% sustained for 10 minutes
   - Critical user flows broken (auth, visit tracking)

2. **Severe Performance Degradation**:
   - Response time p95 > 5 seconds
   - Database queries timing out
   - Connection pool exhausted

3. **Compliance Violation**:
   - HIPAA compliance breach detected
   - EVV data not being captured
   - Audit logging failures

**MEDIUM - Investigate, Rollback if Unresolvable**:

1. **Moderate Error Rate**:
   - Error rate 1-5% sustained for 30 minutes
   - Non-critical features failing

2. **Performance Issues**:
   - Response time p95 > 1 second
   - Slow database queries

3. **User Reports**:
   - Multiple users reporting same critical issue
   - Mobile app crashes

### Rollback Decision Process

1. **Identify Issue**: Team member identifies rollback trigger
2. **Alert Team**: Post in #incidents Slack channel
3. **Quick Assessment**: 5-minute team huddle
4. **Decision**: Tech lead makes rollback decision
5. **Execute**: Follow rollback procedure (see `ROLLBACK_PROCEDURES.md`)
6. **Communicate**: Notify stakeholders
7. **Post-Mortem**: Schedule incident review

---

## Communication Protocols

### Internal Communication

**Slack Channels**:
- `#production-launch`: Launch coordination
- `#incidents`: Critical issues and rollbacks
- `#monitoring`: Automated monitoring alerts
- `#deployments`: Deployment notifications

**Communication Cadence**:
- **Launch Day H+0 to H+4**: Updates every 30 minutes
- **Launch Day H+4 to H+24**: Updates every 2 hours
- **Days 2-7**: Daily summary
- **Week 2+**: Weekly summary

### External Communication

**Stakeholder Updates**:

Use templates from `STAKEHOLDER_COMMUNICATIONS.md`:

1. **Pre-Launch** (T-7 days):
   - Launch date and time
   - Expected impact
   - What to expect

2. **Launch Day** (H+0):
   - Deployment started
   - Expected completion time
   - Where to report issues

3. **Launch Complete** (H+2):
   - Successful deployment
   - New features available
   - Support contact information

4. **Incident Notification** (As needed):
   - Issue description
   - Impact assessment
   - Resolution timeline
   - Workarounds if available

**User Communication**:

- In-app notifications for major changes
- Email for critical updates
- Status page for ongoing incidents

---

## Contact Information

### On-Call Rotation

**Primary On-Call** (Launch Week):
- Name: [Primary Engineer]
- Phone: [Phone Number]
- Slack: @primary-engineer

**Secondary On-Call**:
- Name: [Secondary Engineer]
- Phone: [Phone Number]
- Slack: @secondary-engineer

### Escalation Path

1. **Level 1**: On-call engineer
2. **Level 2**: Tech lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO

### External Contacts

**Vercel Support**:
- Email: support@vercel.com
- Dashboard: https://vercel.com/support
- Priority: Enterprise (if applicable)

**Neon Support** (Database):
- Email: support@neon.tech
- Dashboard: https://console.neon.tech
- Priority: Pro plan support

**Sentry Support**:
- Email: support@sentry.io
- Dashboard: https://sentry.io/support

---

## Appendix

### Useful Commands

```bash
# Check deployment status
vercel list --scope [your-org]

# View live logs
vercel logs [deployment-url]

# Check database migrations
npm run db:migrate:status

# View metrics
curl https://[domain]/metrics

# Test health
curl https://[domain]/health
```

### Success Metrics

**Launch Day Success Criteria**:
- ✅ Zero critical errors
- ✅ Error rate < 1%
- ✅ Response time p95 < 500ms
- ✅ All health checks passing
- ✅ No rollbacks required
- ✅ Positive user feedback

**Week 1 Success Criteria**:
- ✅ 99.9% uptime
- ✅ < 5 non-critical bugs
- ✅ Zero data loss incidents
- ✅ Zero security incidents
- ✅ User adoption meeting targets

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Review**: Post-Launch + 1 week
